cmake_minimum_required(VERSION 3.21)

project(SilverWolfQtClient
    VERSION 0.1.0
    DESCRIPTION "Qt Quick + C++ clone of the Silver Wolf VI assistant shell"
    LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

# Targets Qt 6.11.x as installed on this machine (`qmake6 --version`).
# 6.5 is the floor because qt_standard_project_setup / loadFromModule are used.
find_package(Qt6 6.5 REQUIRED COMPONENTS Core Gui Qml Quick QuickControls2 Network)

qt_standard_project_setup(REQUIRES 6.5)

# QML files live in qml/ rather than the module root; NEW generates the extra
# qmldir Qt wants for that subdirectory.
if(QT_KNOWN_POLICY_QTP0004)
    qt_policy(SET QTP0004 NEW)
endif()

qt_add_executable(silverwolf-qt
    src/main.cpp
)

qt_add_qml_module(silverwolf-qt
    URI SilverWolf
    VERSION 1.0
    QML_FILES
        qml/Main.qml
    SOURCES
        src/OllamaClient.h
        src/OllamaClient.cpp
        src/HardwareMonitor.h
        src/HardwareMonitor.cpp
        src/ProcessRunner.h
        src/ProcessRunner.cpp
)

target_include_directories(silverwolf-qt PRIVATE src)

target_link_libraries(silverwolf-qt PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Network
)

# Keep the QML type registration honest at build time rather than at runtime.
set_target_properties(silverwolf-qt PROPERTIES
    WIN32_EXECUTABLE ON
    MACOSX_BUNDLE ON
)

install(TARGETS silverwolf-qt
    BUNDLE  DESTINATION .
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
)
