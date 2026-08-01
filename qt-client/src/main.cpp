#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQuickStyle>

#include <QObject>

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    app.setApplicationName(QStringLiteral("Silver Wolf VI (Qt)"));
    app.setOrganizationName(QStringLiteral("SilverWolf"));

    // Basic is the only style that honours arbitrary customisation without
    // fighting a platform theme.
    QQuickStyle::setStyle(QStringLiteral("Basic"));

    QQmlApplicationEngine engine;
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, []() { QCoreApplication::exit(-1); },
                     Qt::QueuedConnection);

    // Types are registered by qt_add_qml_module via QML_ELEMENT on
    // OllamaClient / HardwareMonitor / ProcessRunner.
    engine.loadFromModule("SilverWolf", "Main");

    return app.exec();
}
