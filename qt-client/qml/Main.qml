import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import SilverWolf

ApplicationWindow {
    id: root

    width: 900
    height: 640
    visible: true
    title: qsTr("Silver Wolf VI - Qt client")
    color: "#0b0d12"

    readonly property color panel: "#141821"
    readonly property color stroke: "#232a38"
    readonly property color textPrimary: "#e6e9f0"
    readonly property color textMuted: "#8b93a7"
    readonly property color accent: "#7aa2f7"

    // Tail of the current model's chain-of-thought, cleared once real content
    // starts arriving.
    property string reasoning: ""

    HardwareMonitor {
        id: hardware
    }

    ProcessRunner {
        id: shell

        onFinished: (exitCode, standardOutput, standardError) => {
            chatModel.append({
                role: "tool",
                body: "exit " + exitCode + "\n" + (standardOutput || standardError)
            })
        }
        onFailed: (reason) => {
            chatModel.append({ role: "error", body: reason })
        }
    }

    OllamaClient {
        id: llm

        // The hardware budget filters model selection exactly as
        // bridge/local_llm.py does.
        Component.onCompleted: refreshModels(hardware.modelBudgetBytes)

        // Thinking models stream reasoning before any content; show it as a
        // transient status line rather than letting the window sit silent.
        onReasoningReceived: (token) => {
            root.reasoning = (root.reasoning + token).slice(-160)
        }

        onTokenReceived: (token) => {
            root.reasoning = ""
            if (chatModel.count === 0 || chatModel.get(chatModel.count - 1).role !== "assistant") {
                chatModel.append({ role: "assistant", body: token })
            } else {
                const i = chatModel.count - 1
                chatModel.setProperty(i, "body", chatModel.get(i).body + token)
            }
            chatView.positionViewAtEnd()
        }
        onErrorOccurred: (message) => {
            chatModel.append({ role: "error", body: message })
            chatView.positionViewAtEnd()
        }
        onResponseFinished: chatView.positionViewAtEnd()
    }

    ListModel {
        id: chatModel
    }

    header: ToolBar {
        height: 56
        background: Rectangle {
            color: root.panel
            border.color: root.stroke
            border.width: 0
            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width
                height: 1
                color: root.stroke
            }
        }

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 16
            anchors.rightMargin: 16
            spacing: 16

            Label {
                text: qsTr("Silver Wolf VI")
                color: root.textPrimary
                font.pixelSize: 16
                font.bold: true
            }

            Label {
                Layout.fillWidth: true
                elide: Text.ElideRight
                color: root.textMuted
                font.pixelSize: 12
                text: (llm.model || qsTr("no model")) + "  -  " + llm.status
            }

            // Hardware status readout, bound to HardwareMonitor.
            Label {
                color: root.textMuted
                font.pixelSize: 12
                font.family: "monospace"
                text: qsTr("RAM %1 / %2  -  %3 CPU  -  budget %4 (%5, %6)")
                    .arg(hardware.formatBytes(hardware.totalRamBytes - hardware.availableRamBytes))
                    .arg(hardware.formatBytes(hardware.totalRamBytes))
                    .arg(hardware.cpuCount)
                    .arg(hardware.formatBytes(hardware.modelBudgetBytes))
                    .arg(hardware.tierLabel)
                    .arg(hardware.inferenceMode)
            }
        }
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 12

        ListView {
            id: chatView

            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            spacing: 8
            model: chatModel
            boundsBehavior: Flickable.StopAtBounds

            ScrollBar.vertical: ScrollBar {}

            delegate: Item {
                required property string role
                required property string body

                width: ListView.view.width
                implicitHeight: bubble.implicitHeight

                Rectangle {
                    id: bubble

                    readonly property bool mine: role === "user"

                    anchors.right: mine ? parent.right : undefined
                    anchors.left: mine ? undefined : parent.left
                    width: Math.min(parent.width * 0.82, Math.max(120, message.implicitWidth + 24))
                    implicitHeight: message.implicitHeight + 20
                    radius: 10
                    color: mine ? "#1d2740"
                        : role === "error" ? "#3a1d22"
                        : role === "tool" ? "#12211c"
                        : root.panel
                    border.color: root.stroke
                    border.width: 1

                    Label {
                        id: message

                        anchors.fill: parent
                        anchors.margins: 10
                        text: body
                        wrapMode: Text.Wrap
                        textFormat: Text.PlainText
                        color: role === "error" ? "#ff8891" : root.textPrimary
                        font.pixelSize: 13
                        font.family: role === "tool" ? "monospace" : font.family
                    }
                }
            }
        }

        Label {
            Layout.fillWidth: true
            visible: llm.busy && root.reasoning.length > 0
            text: qsTr("thinking: ") + root.reasoning
            color: root.textMuted
            font.pixelSize: 11
            font.italic: true
            elide: Text.ElideLeft
            maximumLineCount: 1
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            TextField {
                id: input

                Layout.fillWidth: true
                placeholderText: llm.busy ? qsTr("Generating...") : qsTr("Ask the local model")
                enabled: !llm.busy
                color: root.textPrimary
                placeholderTextColor: root.textMuted
                selectByMouse: true

                background: Rectangle {
                    radius: 8
                    color: root.panel
                    border.color: input.activeFocus ? root.accent : root.stroke
                    border.width: 1
                }

                onAccepted: root.submit()
            }

            Button {
                text: llm.busy ? qsTr("Stop") : qsTr("Send")
                onClicked: llm.busy ? llm.cancel() : root.submit()
            }
        }
    }

    function submit() {
        const text = input.text.trim()
        if (text.length === 0)
            return
        chatModel.append({ role: "user", body: text })
        input.text = ""
        chatView.positionViewAtEnd()
        llm.sendMessage(text)
    }
}
