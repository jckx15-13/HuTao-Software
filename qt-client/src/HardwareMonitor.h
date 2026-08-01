// HardwareMonitor - RAM/CPU probe feeding the local-model memory budget.
//
// Mirrors detect_hardware() in bridge/hardware.py:
//   dedicated VRAM > 0 -> budget = full VRAM            (mode "gpu")
//   unified memory     -> budget = 65% of RAM           (mode "unified")
//   otherwise          -> budget = 55% of RAM - 2 GiB   (mode "cpu")
//
// The CPU-only formula deliberately reserves headroom for the OS and the rest
// of the desktop rather than assuming the machine is idle.
//
// Linux is the primary target: RAM comes from /proc/meminfo and discrete AMD
// VRAM from /sys/class/drm/card*/device/mem_info_vram_total. Other platforms
// degrade to a conservative answer instead of failing.

#pragma once

#include <QObject>
#include <QQmlEngine>
#include <QString>

class QTimer;

class HardwareMonitor : public QObject
{
    Q_OBJECT
    QML_ELEMENT

    Q_PROPERTY(qint64 totalRamBytes READ totalRamBytes NOTIFY hardwareChanged)
    Q_PROPERTY(qint64 availableRamBytes READ availableRamBytes NOTIFY hardwareChanged)
    Q_PROPERTY(qint64 dedicatedVramBytes READ dedicatedVramBytes NOTIFY hardwareChanged)
    Q_PROPERTY(qint64 modelBudgetBytes READ modelBudgetBytes NOTIFY hardwareChanged)
    Q_PROPERTY(int cpuCount READ cpuCount CONSTANT)
    Q_PROPERTY(QString inferenceMode READ inferenceMode NOTIFY hardwareChanged)
    Q_PROPERTY(QString tierLabel READ tierLabel NOTIFY hardwareChanged)
    Q_PROPERTY(int refreshIntervalMs READ refreshIntervalMs WRITE setRefreshIntervalMs
                   NOTIFY refreshIntervalMsChanged)

public:
    static constexpr qint64 GiB = 1024LL * 1024LL * 1024LL;

    explicit HardwareMonitor(QObject *parent = nullptr);

    qint64 totalRamBytes() const { return m_totalRamBytes; }
    qint64 availableRamBytes() const { return m_availableRamBytes; }
    qint64 dedicatedVramBytes() const { return m_dedicatedVramBytes; }
    qint64 modelBudgetBytes() const { return m_modelBudgetBytes; }
    int cpuCount() const { return m_cpuCount; }
    QString inferenceMode() const { return m_inferenceMode; }
    QString tierLabel() const;

    int refreshIntervalMs() const { return m_refreshIntervalMs; }
    void setRefreshIntervalMs(int ms);

    // Re-probe now. Emits hardwareChanged() when anything moved.
    Q_INVOKABLE void refresh();

    // "6.4 GiB" style formatting for the QML readout.
    Q_INVOKABLE QString formatBytes(qint64 bytes) const;

signals:
    void hardwareChanged();
    void refreshIntervalMsChanged();

private:
    static qint64 readTotalRamBytes();
    static qint64 readAvailableRamBytes();
    static qint64 readDedicatedVramBytes();
    static bool hasUnifiedMemory();
    static qint64 computeBudget(qint64 ram, qint64 vram, bool unified, QString *mode);

    qint64 m_totalRamBytes = 0;
    qint64 m_availableRamBytes = 0;
    qint64 m_dedicatedVramBytes = 0;
    qint64 m_modelBudgetBytes = 0;
    int m_cpuCount = 1;
    int m_refreshIntervalMs = 5000;
    QString m_inferenceMode = QStringLiteral("cpu");
    QTimer *m_timer = nullptr;
};
