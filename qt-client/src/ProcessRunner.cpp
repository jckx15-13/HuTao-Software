#include "ProcessRunner.h"

#include <QDir>
#include <QFileInfo>
#include <QStandardPaths>
#include <QTimer>

namespace {

// The default allowlist. Read-only, non-interactive, no interpreter, no
// `-exec`-style argument that spawns another program. Anything added here is
// a permanent grant to the model -- see the header comment before extending.
const QStringList kDefaultAllowlist = {
    QStringLiteral("ls"),
    QStringLiteral("cat"),
    QStringLiteral("head"),
    QStringLiteral("tail"),
    QStringLiteral("wc"),
    QStringLiteral("grep"),
    QStringLiteral("rg"),
    QStringLiteral("date"),
    QStringLiteral("uname"),
    QStringLiteral("uptime"),
    QStringLiteral("df"),
    QStringLiteral("free"),
    QStringLiteral("nproc"),
};

bool looksLikePath(const QString &program)
{
    return program.contains(QLatin1Char('/')) || program.contains(QLatin1Char('\\'));
}

} // namespace

ProcessRunner::ProcessRunner(QObject *parent)
    : QObject(parent)
    , m_allowedPrograms(kDefaultAllowlist)
    , m_workingDirectory(QDir::homePath())
{
    m_timeoutTimer = new QTimer(this);
    m_timeoutTimer->setSingleShot(true);
    connect(m_timeoutTimer, &QTimer::timeout, this, &ProcessRunner::onTimeout);
}

ProcessRunner::~ProcessRunner()
{
    if (m_process && m_process->state() != QProcess::NotRunning) {
        m_process->kill();
        m_process->waitForFinished(1000);
    }
}

bool ProcessRunner::running() const
{
    return m_process && m_process->state() != QProcess::NotRunning;
}

void ProcessRunner::setWorkingDirectory(const QString &dir)
{
    if (m_workingDirectory == dir)
        return;
    m_workingDirectory = dir;
    emit workingDirectoryChanged();
}

void ProcessRunner::setTimeoutMs(int ms)
{
    const int clamped = qBound(100, ms, 10 * 60 * 1000);
    if (m_timeoutMs == clamped)
        return;
    m_timeoutMs = clamped;
    emit timeoutMsChanged();
}

bool ProcessRunner::isAllowed(const QString &program) const
{
    const QString candidate = program.trimmed();
    if (candidate.isEmpty())
        return false;
    // Reject paths outright: only bare basenames can match the allowlist, so
    // "./ls" or "/tmp/ls" can never be smuggled through as "ls".
    if (looksLikePath(candidate))
        return false;
    return m_allowedPrograms.contains(candidate);
}

void ProcessRunner::allowProgram(const QString &program)
{
    const QString candidate = program.trimmed();
    if (candidate.isEmpty() || looksLikePath(candidate))
        return;
    if (m_allowedPrograms.contains(candidate))
        return;
    m_allowedPrograms << candidate;
    emit allowedProgramsChanged();
}

void ProcessRunner::disallowProgram(const QString &program)
{
    if (m_allowedPrograms.removeAll(program.trimmed()) > 0)
        emit allowedProgramsChanged();
}

bool ProcessRunner::run(const QString &program, const QStringList &arguments)
{
    if (running()) {
        emit failed(QStringLiteral("a process is already running"));
        return false;
    }

    const QString candidate = program.trimmed();

    // Boundary check. Re-done here even though QML may have called isAllowed():
    // callers are not trusted to have asked.
    if (!isAllowed(candidate)) {
        emit failed(QStringLiteral("program '%1' is not on the allowlist").arg(candidate));
        return false;
    }

    // Resolve the basename against PATH ourselves so the child is launched from
    // a known absolute path rather than whatever the environment resolves to
    // later.
    const QString resolved = QStandardPaths::findExecutable(candidate);
    if (resolved.isEmpty()) {
        emit failed(QStringLiteral("program '%1' was not found on PATH").arg(candidate));
        return false;
    }

    m_stdout.clear();
    m_stderr.clear();
    m_timedOut = false;
    m_currentProgram = candidate;

    m_process = new QProcess(this);
    m_process->setProgram(resolved);
    // QStringList arguments go straight to execve(2). No shell, so no
    // metacharacter expansion, word splitting, or globbing takes place.
    m_process->setArguments(arguments);
    m_process->setProcessChannelMode(QProcess::SeparateChannels);
    if (!m_workingDirectory.isEmpty())
        m_process->setWorkingDirectory(m_workingDirectory);

    connect(m_process, &QProcess::readyReadStandardOutput, this, &ProcessRunner::drainChannels);
    connect(m_process, &QProcess::readyReadStandardError, this, &ProcessRunner::drainChannels);
    connect(m_process, &QProcess::errorOccurred, this, &ProcessRunner::onProcessErrorOccurred);
    connect(m_process, &QProcess::finished, this, &ProcessRunner::onProcessFinished);

    m_process->start();
    // Nothing is ever written to the child; close stdin so an interactive tool
    // fails fast instead of blocking until the timeout.
    m_process->closeWriteChannel();

    m_timeoutTimer->start(m_timeoutMs);
    emit runningChanged();
    emit started(candidate, arguments);
    return true;
}

void ProcessRunner::cancel()
{
    if (!running())
        return;
    m_process->kill();
}

void ProcessRunner::onTimeout()
{
    if (!running())
        return;
    m_timedOut = true;
    m_process->kill();
}

void ProcessRunner::drainChannels()
{
    if (!m_process)
        return;

    // Bound the capture so a chatty tool cannot exhaust memory.
    if (m_stdout.size() < m_maxOutputBytes)
        m_stdout.append(m_process->readAllStandardOutput());
    else
        m_process->readAllStandardOutput();

    if (m_stderr.size() < m_maxOutputBytes)
        m_stderr.append(m_process->readAllStandardError());
    else
        m_process->readAllStandardError();
}

void ProcessRunner::onProcessErrorOccurred(QProcess::ProcessError error)
{
    if (error != QProcess::FailedToStart)
        return; // crashes/timeouts surface through finished()
    const QString program = m_currentProgram;
    reset();
    emit failed(QStringLiteral("failed to start '%1'").arg(program));
}

void ProcessRunner::onProcessFinished(int exitCode, QProcess::ExitStatus status)
{
    drainChannels();

    const bool timedOut = m_timedOut;
    const QString program = m_currentProgram;
    const QString out = QString::fromUtf8(m_stdout);
    const QString err = QString::fromUtf8(m_stderr);
    const bool crashed = status == QProcess::CrashExit;

    reset();

    if (timedOut) {
        emit failed(QStringLiteral("'%1' exceeded the %2 ms timeout and was killed")
                        .arg(program)
                        .arg(m_timeoutMs));
        return;
    }
    if (crashed) {
        emit failed(QStringLiteral("'%1' terminated abnormally").arg(program));
        return;
    }

    emit finished(exitCode, out, err);
}

void ProcessRunner::reset()
{
    m_timeoutTimer->stop();
    if (m_process) {
        m_process->disconnect(this);
        m_process->deleteLater();
        m_process = nullptr;
    }
    m_stdout.clear();
    m_stderr.clear();
    m_timedOut = false;
    m_currentProgram.clear();
    emit runningChanged();
}
