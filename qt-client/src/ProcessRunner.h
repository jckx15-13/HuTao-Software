// ProcessRunner - QProcess wrapper for agentic shell tool-calls.
//
// ============================================================================
// SECURITY BOUNDARY: `m_allowedPrograms` IS the security boundary.
// ============================================================================
// A local model can be prompt-injected by anything it reads (a web page, a
// file, a tool result). Treat every (program, arguments) pair reaching run()
// as attacker-controlled and enforce the boundary here, in C++ -- never in the
// prompt, and never in QML.
//
// The invariants that make the allowlist meaningful:
//
//   1. NO SHELL. Arguments are passed as a QStringList straight to execve(2)
//      via QProcess::start(program, args). There is never a single command
//      string, so `;`, `|`, `&&`, backticks, `$(...)` and globs are inert
//      literal characters rather than syntax. Do not add a QProcess::start()
//      overload that takes one string, and do not run `sh -c`.
//   2. BASENAMES ONLY. The program must be a bare name present in the
//      allowlist. A path (anything containing '/' or '\\') is rejected, so
//      `./evil` and `/tmp/evil` cannot masquerade as an allowed name; the real
//      binary is then resolved through QStandardPaths::findExecutable().
//   3. ONE AT A TIME + TIMEOUT. A single in-flight process, killed after
//      `timeoutMs`, so a hung or wedged tool-call cannot pin the UI or leak
//      processes.
//   4. NO INHERITED SHELL STATE. stdin is closed and stdout/stderr are captured
//      separately, bounded by `maxOutputBytes`.
//
// Adding an entry to the allowlist grants the model everything that binary can
// do -- including anything it can be argued into doing. `find -exec`, `git
// -c core.pager=...`, `awk 'BEGIN{system(...)}'`, and any interpreter
// (python, node, perl, sh) are shell escapes wearing a different name. The
// default list is intentionally read-only and boring.

#pragma once

#include <QObject>
#include <QProcess>
#include <QQmlEngine>
#include <QString>
#include <QStringList>

class QTimer;

class ProcessRunner : public QObject
{
    Q_OBJECT
    QML_ELEMENT

    Q_PROPERTY(QStringList allowedPrograms READ allowedPrograms NOTIFY allowedProgramsChanged)
    Q_PROPERTY(QString workingDirectory READ workingDirectory WRITE setWorkingDirectory
                   NOTIFY workingDirectoryChanged)
    Q_PROPERTY(int timeoutMs READ timeoutMs WRITE setTimeoutMs NOTIFY timeoutMsChanged)
    Q_PROPERTY(bool running READ running NOTIFY runningChanged)

public:
    explicit ProcessRunner(QObject *parent = nullptr);
    ~ProcessRunner() override;

    QStringList allowedPrograms() const { return m_allowedPrograms; }
    QString workingDirectory() const { return m_workingDirectory; }
    void setWorkingDirectory(const QString &dir);
    int timeoutMs() const { return m_timeoutMs; }
    void setTimeoutMs(int ms);
    bool running() const;

    // True when `program` is a bare basename on the allowlist. QML should call
    // this to grey out a tool-call button, but run() re-checks regardless --
    // the UI is not the boundary.
    Q_INVOKABLE bool isAllowed(const QString &program) const;

    // Run an allowlisted program. Returns false and emits failed() when the
    // request is rejected or another process is already running.
    //
    // `arguments` are passed verbatim to the child; they are NOT parsed by a
    // shell and must not be pre-quoted.
    Q_INVOKABLE bool run(const QString &program, const QStringList &arguments = {});

    // Kill the in-flight process. Safe to call when idle.
    Q_INVOKABLE void cancel();

    // Allowlist maintenance. Deliberately explicit and code/config-driven, so
    // that widening the boundary is a visible act rather than a side effect of
    // a model deciding it needs a new tool. Never wire these to model output.
    Q_INVOKABLE void allowProgram(const QString &program);
    Q_INVOKABLE void disallowProgram(const QString &program);

signals:
    void started(const QString &program, const QStringList &arguments);
    void finished(int exitCode, const QString &standardOutput, const QString &standardError);
    void failed(const QString &reason);

    void allowedProgramsChanged();
    void workingDirectoryChanged();
    void timeoutMsChanged();
    void runningChanged();

private:
    void onProcessFinished(int exitCode, QProcess::ExitStatus status);
    void onProcessErrorOccurred(QProcess::ProcessError error);
    void onTimeout();
    void drainChannels();
    void reset();

    QStringList m_allowedPrograms;
    QString m_workingDirectory;
    int m_timeoutMs = 15000;
    qint64 m_maxOutputBytes = 1 << 20; // 1 MiB per channel

    QProcess *m_process = nullptr;
    QTimer *m_timeoutTimer = nullptr;
    QString m_currentProgram;
    QByteArray m_stdout;
    QByteArray m_stderr;
    bool m_timedOut = false;
};
