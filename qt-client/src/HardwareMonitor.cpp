#include "HardwareMonitor.h"

#include <QByteArray>
#include <QDir>
#include <QFile>
#include <QSysInfo>
#include <QThread>
#include <QTimer>
#include <QtGlobal>

namespace {

// Parse a /proc/meminfo line of the form "MemTotal:  16311596 kB".
qint64 meminfoField(const char *key)
{
    QFile file(QStringLiteral("/proc/meminfo"));
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text))
        return 0;

    const QByteArray prefix = QByteArray(key) + ':';
    while (!file.atEnd()) {
        const QByteArray line = file.readLine();
        if (!line.startsWith(prefix))
            continue;
        const QList<QByteArray> parts = line.simplified().split(' ');
        if (parts.size() < 2)
            return 0;
        bool ok = false;
        const qint64 kb = parts.at(1).toLongLong(&ok);
        return ok ? kb * 1024 : 0;
    }
    return 0;
}

} // namespace

HardwareMonitor::HardwareMonitor(QObject *parent)
    : QObject(parent)
{
    m_cpuCount = qMax(1, QThread::idealThreadCount());

    m_timer = new QTimer(this);
    m_timer->setInterval(m_refreshIntervalMs);
    connect(m_timer, &QTimer::timeout, this, &HardwareMonitor::refresh);
    m_timer->start();

    refresh();
}

void HardwareMonitor::setRefreshIntervalMs(int ms)
{
    if (m_refreshIntervalMs == ms)
        return;
    m_refreshIntervalMs = qMax(250, ms);
    if (m_timer)
        m_timer->setInterval(m_refreshIntervalMs);
    emit refreshIntervalMsChanged();
}

qint64 HardwareMonitor::readTotalRamBytes()
{
    return meminfoField("MemTotal");
}

qint64 HardwareMonitor::readAvailableRamBytes()
{
    // MemAvailable is the kernel's own estimate of reclaimable memory and is a
    // far better signal than MemFree, which excludes the page cache.
    const qint64 available = meminfoField("MemAvailable");
    return available > 0 ? available : meminfoField("MemFree");
}

qint64 HardwareMonitor::readDedicatedVramBytes()
{
    // Discrete AMD via sysfs. Works without rocm-smi installed.
    // NVIDIA would need nvidia-smi (a subprocess); left out of the skeleton so
    // this probe stays allocation-free and non-blocking.
    qint64 best = 0;
    QDir drm(QStringLiteral("/sys/class/drm"));
    const QStringList cards =
        drm.entryList({QStringLiteral("card*")}, QDir::Dirs | QDir::NoDotAndDotDot);
    for (const QString &card : cards) {
        QFile file(drm.absoluteFilePath(card + QStringLiteral("/device/mem_info_vram_total")));
        if (!file.open(QIODevice::ReadOnly | QIODevice::Text))
            continue;
        bool ok = false;
        const qint64 total = file.readAll().trimmed().toLongLong(&ok);
        if (ok && total > best)
            best = total;
    }
    return best;
}

bool HardwareMonitor::hasUnifiedMemory()
{
    // Apple Silicon: no separate VRAM pool, weights share system memory.
#if defined(Q_OS_MACOS)
    return QSysInfo::currentCpuArchitecture().startsWith(QLatin1String("arm"));
#else
    return false;
#endif
}

qint64 HardwareMonitor::computeBudget(qint64 ram, qint64 vram, bool unified, QString *mode)
{
    if (vram > 0) {
        if (mode)
            *mode = QStringLiteral("gpu");
        return vram;
    }
    if (unified) {
        if (mode)
            *mode = QStringLiteral("unified");
        return static_cast<qint64>(static_cast<double>(ram) * 0.65);
    }
    if (mode)
        *mode = QStringLiteral("cpu");
    // 55% of RAM minus 2 GiB for the OS and the rest of the desktop.
    return qMax<qint64>(0, static_cast<qint64>(static_cast<double>(ram) * 0.55) - 2 * GiB);
}

void HardwareMonitor::refresh()
{
    const qint64 total = readTotalRamBytes();
    const qint64 available = readAvailableRamBytes();
    const qint64 vram = readDedicatedVramBytes();

    QString mode;
    const qint64 budget = computeBudget(total, vram, hasUnifiedMemory(), &mode);

    const bool changed = total != m_totalRamBytes
        || available != m_availableRamBytes
        || vram != m_dedicatedVramBytes
        || budget != m_modelBudgetBytes
        || mode != m_inferenceMode;

    m_totalRamBytes = total;
    m_availableRamBytes = available;
    m_dedicatedVramBytes = vram;
    m_modelBudgetBytes = budget;
    m_inferenceMode = mode;

    if (changed)
        emit hardwareChanged();
}

QString HardwareMonitor::tierLabel() const
{
    // Same thresholds as budget_to_tier() in bridge/hardware.py.
    const double gib = static_cast<double>(m_modelBudgetBytes) / static_cast<double>(GiB);
    if (gib < 2)
        return QStringLiteral("minimal");
    if (gib < 4)
        return QStringLiteral("low");
    if (gib < 6)
        return QStringLiteral("mid");
    if (gib < 11)
        return QStringLiteral("comfortable");
    if (gib < 22)
        return QStringLiteral("high");
    if (gib < 48)
        return QStringLiteral("workstation");
    return QStringLiteral("server");
}

QString HardwareMonitor::formatBytes(qint64 bytes) const
{
    if (bytes <= 0)
        return QStringLiteral("unknown");
    const double gib = static_cast<double>(bytes) / static_cast<double>(GiB);
    if (gib >= 1.0)
        return QStringLiteral("%1 GiB").arg(gib, 0, 'f', 1);
    const double mib = static_cast<double>(bytes) / (1024.0 * 1024.0);
    return QStringLiteral("%1 MiB").arg(mib, 0, 'f', 0);
}
