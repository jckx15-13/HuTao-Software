// OllamaClient - streaming chat against an OpenAI-compatible local runtime.
//
// Mirrors the contract implemented by bridge/local_llm.py:
//   * POST <base>/v1/chat/completions, no API key (local runtimes are keyless).
//   * OLLAMA_BASE_URL defaults to http://127.0.0.1:11434.
//   * OLLAMA_MODEL, when set, is trusted even if absent from /api/tags -- the
//     user may have pulled it out of band.
//   * Otherwise the model is picked from what is actually installed. Never
//     select a model that is not pulled: a 404 is a worse failure than a
//     smaller model.
//
// Unlike the React SPA this talks to the runtime directly; there is no FastAPI
// bridge hop on 127.0.0.1:8001 in the Qt client.

#pragma once

#include <QByteArray>
#include <QJsonArray>
#include <QNetworkAccessManager>
#include <QObject>
#include <QPointer>
#include <QQmlEngine>
#include <QString>
#include <QStringList>
#include <QUrl>

class QNetworkReply;

class OllamaClient : public QObject
{
    Q_OBJECT
    QML_ELEMENT

    Q_PROPERTY(QUrl baseUrl READ baseUrl WRITE setBaseUrl NOTIFY baseUrlChanged)
    Q_PROPERTY(QString model READ model WRITE setModel NOTIFY modelChanged)
    Q_PROPERTY(QString systemPrompt READ systemPrompt WRITE setSystemPrompt
                   NOTIFY systemPromptChanged)
    Q_PROPERTY(QStringList installedModels READ installedModels NOTIFY installedModelsChanged)
    Q_PROPERTY(QString status READ status NOTIFY statusChanged)
    Q_PROPERTY(bool busy READ busy NOTIFY busyChanged)

public:
    explicit OllamaClient(QObject *parent = nullptr);
    ~OllamaClient() override;

    QUrl baseUrl() const { return m_baseUrl; }
    void setBaseUrl(const QUrl &url);

    QString model() const { return m_model; }
    void setModel(const QString &model);

    QString systemPrompt() const { return m_systemPrompt; }
    void setSystemPrompt(const QString &prompt);

    QStringList installedModels() const { return m_installedModels; }
    QString status() const { return m_status; }
    bool busy() const { return m_reply != nullptr; }

    // Send `text` as a user turn and stream the assistant reply back through
    // tokenReceived(). The conversation history is kept in-process so the
    // model sees prior turns.
    Q_INVOKABLE void sendMessage(const QString &text);

    // Abort an in-flight completion. Safe to call when idle.
    Q_INVOKABLE void cancel();

    // GET <base>/api/tags -> installedModels, and adopt a default model when
    // none has been chosen yet. `budgetBytes <= 0` disables the size filter.
    Q_INVOKABLE void refreshModels(qint64 budgetBytes = 0);

    // Drop conversation history (keeps the system prompt).
    Q_INVOKABLE void resetConversation();

signals:
    void tokenReceived(const QString &token);

    // Thinking models (every qwen3 tag, deepseek-r1) stream their chain of
    // thought in delta.reasoning with delta.content empty. Kept separate from
    // tokenReceived so it can be rendered differently -- and it is deliberately
    // NOT appended to the conversation history.
    void reasoningReceived(const QString &token);

    void responseFinished();
    void errorOccurred(const QString &message);

    void baseUrlChanged();
    void modelChanged();
    void systemPromptChanged();
    void installedModelsChanged();
    void statusChanged();
    void busyChanged();

private:
    void onReadyRead();
    void onFinished();
    void consumeSseLine(const QByteArray &line);
    void teardownReply();
    void setStatus(const QString &status);
    void fail(const QString &message);

    QNetworkAccessManager m_network;
    QPointer<QNetworkReply> m_reply;

    QUrl m_baseUrl;
    QString m_model;
    QString m_systemPrompt;
    QString m_status;
    QStringList m_installedModels;

    // Partial SSE frame carried across readyRead() boundaries: a chunk can end
    // mid-line, so anything after the last '\n' must be buffered.
    QByteArray m_sseBuffer;

    // OpenAI-shaped message history: [{role, content}, ...]
    QJsonArray m_history;
    QString m_assistantAccumulator;
    bool m_sawDone = false;
};
