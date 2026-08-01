#include "OllamaClient.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonValue>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QtGlobal>

#include <algorithm>

namespace {

constexpr const char *kDefaultBaseUrl = "http://127.0.0.1:11434";

// bridge/local_llm.py leaves ~15% headroom inside the budget; running right at
// the limit means swapping, which feels like a hang rather than slowness.
constexpr double kUsableFraction = 0.85;

QString envOrDefault(const char *name, const QString &fallback)
{
    const QByteArray raw = qgetenv(name);
    const QString value = QString::fromUtf8(raw).trimmed();
    return value.isEmpty() ? fallback : value;
}

// Ollama's /api/tags reports capabilities directly; trust it when present.
bool entryHasTools(const QJsonObject &item)
{
    const QJsonArray caps = item.value(QStringLiteral("capabilities")).toArray();
    for (const QJsonValue &cap : caps) {
        if (cap.toString() == QLatin1String("tools"))
            return true;
    }
    return false;
}

} // namespace

OllamaClient::OllamaClient(QObject *parent)
    : QObject(parent)
    , m_baseUrl(envOrDefault("OLLAMA_BASE_URL", QString::fromLatin1(kDefaultBaseUrl)))
    , m_model(envOrDefault("OLLAMA_MODEL", QString()))
    , m_systemPrompt(QStringLiteral("You are Silver Wolf VI, a local-first assistant."))
    , m_status(QStringLiteral("idle"))
{
    if (!m_model.isEmpty())
        setStatus(QStringLiteral("model pinned via OLLAMA_MODEL"));
}

OllamaClient::~OllamaClient()
{
    // QPointer, so this is a no-op if the reply already died with the manager.
    if (m_reply)
        m_reply->abort();
}

void OllamaClient::setBaseUrl(const QUrl &url)
{
    if (m_baseUrl == url)
        return;
    m_baseUrl = url;
    emit baseUrlChanged();
}

void OllamaClient::setModel(const QString &model)
{
    if (m_model == model)
        return;
    m_model = model;
    emit modelChanged();
}

void OllamaClient::setSystemPrompt(const QString &prompt)
{
    if (m_systemPrompt == prompt)
        return;
    m_systemPrompt = prompt;
    emit systemPromptChanged();
}

void OllamaClient::setStatus(const QString &status)
{
    if (m_status == status)
        return;
    m_status = status;
    emit statusChanged();
}

void OllamaClient::resetConversation()
{
    m_history = QJsonArray();
}

void OllamaClient::cancel()
{
    if (!m_reply)
        return;
    // abort() triggers finished(); teardown happens there.
    m_reply->abort();
}

void OllamaClient::fail(const QString &message)
{
    setStatus(message);
    emit errorOccurred(message);
}

void OllamaClient::teardownReply()
{
    if (!m_reply)
        return;
    QNetworkReply *reply = m_reply;
    m_reply = nullptr;
    reply->disconnect(this);
    reply->deleteLater();
    emit busyChanged();
}

void OllamaClient::refreshModels(qint64 budgetBytes)
{
    QUrl url = m_baseUrl;
    url.setPath(QStringLiteral("/api/tags"));

    QNetworkRequest request(url);
    request.setTransferTimeout(5000);

    QNetworkReply *reply = m_network.get(request);
    connect(reply, &QNetworkReply::finished, this, [this, reply, budgetBytes]() {
        reply->deleteLater();
        if (reply->error() != QNetworkReply::NoError) {
            setStatus(QStringLiteral("no local LLM runtime reachable"));
            return;
        }

        const QJsonObject root =
            QJsonDocument::fromJson(reply->readAll()).object();
        const QJsonArray models = root.value(QStringLiteral("models")).toArray();

        QStringList names;
        struct Candidate {
            QString id;
            qint64 size = 0;
            bool tools = false;
        };
        QList<Candidate> candidates;

        for (const QJsonValue &value : models) {
            const QJsonObject item = value.toObject();
            const QString name = item.value(QStringLiteral("name")).toString().isEmpty()
                ? item.value(QStringLiteral("model")).toString()
                : item.value(QStringLiteral("name")).toString();
            if (name.isEmpty())
                continue;
            names << name;
            candidates.append({name,
                               static_cast<qint64>(item.value(QStringLiteral("size")).toDouble()),
                               entryHasTools(item)});
        }

        if (names != m_installedModels) {
            m_installedModels = names;
            emit installedModelsChanged();
        }

        if (candidates.isEmpty()) {
            setStatus(QStringLiteral("runtime reachable but no models pulled"));
            return;
        }

        // An explicit OLLAMA_MODEL override wins outright.
        if (!qgetenv("OLLAMA_MODEL").isEmpty())
            return;

        // Selection order mirrors select_model() in bridge/local_llm.py:
        // tool-capable and inside the budget > inside the budget > tool-capable
        // > anything installed. Degraded chat beats no chat.
        const double usable = budgetBytes > 0
            ? static_cast<double>(budgetBytes) * kUsableFraction
            : 0.0;
        const auto fits = [usable](const Candidate &c) {
            return usable <= 0.0 || c.size == 0 || static_cast<double>(c.size) <= usable;
        };
        const auto largest = [](const QList<Candidate> &pool) {
            return *std::max_element(pool.cbegin(), pool.cend(),
                                     [](const Candidate &a, const Candidate &b) {
                                         return a.size < b.size;
                                     });
        };

        QList<Candidate> toolsAndFits, justFits, justTools;
        for (const Candidate &c : std::as_const(candidates)) {
            if (c.tools && fits(c))
                toolsAndFits << c;
            if (fits(c))
                justFits << c;
            if (c.tools)
                justTools << c;
        }

        Candidate chosen;
        QStringList notes;
        if (!toolsAndFits.isEmpty()) {
            chosen = largest(toolsAndFits);
        } else if (!justFits.isEmpty()) {
            chosen = largest(justFits);
            notes << QStringLiteral("no tool calling");
        } else if (!justTools.isEmpty()) {
            chosen = largest(justTools);
            notes << QStringLiteral("exceeds hardware budget - expect swapping");
        } else {
            chosen = largest(candidates);
            notes << QStringLiteral("no tool calling")
                  << QStringLiteral("exceeds hardware budget - expect swapping");
        }

        setModel(chosen.id);
        setStatus(notes.isEmpty()
                      ? QStringLiteral("local Ollama endpoint")
                      : QStringLiteral("local Ollama endpoint [%1]").arg(notes.join(QStringLiteral("; "))));
    });
}

void OllamaClient::sendMessage(const QString &text)
{
    if (text.trimmed().isEmpty())
        return;

    if (m_reply) {
        fail(QStringLiteral("a completion is already in flight"));
        return;
    }

    if (m_model.isEmpty()) {
        fail(QStringLiteral("no model selected - set OLLAMA_MODEL or call refreshModels()"));
        return;
    }

    QJsonObject userTurn;
    userTurn.insert(QStringLiteral("role"), QStringLiteral("user"));
    userTurn.insert(QStringLiteral("content"), text);
    m_history.append(userTurn);

    QJsonArray messages;
    if (!m_systemPrompt.isEmpty()) {
        QJsonObject system;
        system.insert(QStringLiteral("role"), QStringLiteral("system"));
        system.insert(QStringLiteral("content"), m_systemPrompt);
        messages.append(system);
    }
    for (const QJsonValue &turn : std::as_const(m_history))
        messages.append(turn);

    QJsonObject payload;
    payload.insert(QStringLiteral("model"), m_model);
    payload.insert(QStringLiteral("messages"), messages);
    payload.insert(QStringLiteral("stream"), true);
    payload.insert(QStringLiteral("temperature"), 0);

    QUrl url = m_baseUrl;
    url.setPath(QStringLiteral("/v1/chat/completions"));

    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader,
                      QStringLiteral("application/json"));
    request.setRawHeader("Accept", "text/event-stream");
    // Deliberately keyless: local runtimes need no Authorization header.
    // CPU inference is slow, so do not let the default transfer timeout kill a
    // legitimately long generation; per-chunk activity keeps the socket alive.
    request.setTransferTimeout(0);
    request.setAttribute(QNetworkRequest::Http2AllowedAttribute, false);

    m_sseBuffer.clear();
    m_assistantAccumulator.clear();
    m_sawDone = false;

    m_reply = m_network.post(request, QJsonDocument(payload).toJson(QJsonDocument::Compact));
    emit busyChanged();

    connect(m_reply, &QNetworkReply::readyRead, this, &OllamaClient::onReadyRead);
    connect(m_reply, &QNetworkReply::finished, this, &OllamaClient::onFinished);
}

void OllamaClient::onReadyRead()
{
    if (!m_reply)
        return;

    m_sseBuffer.append(m_reply->readAll());

    // SSE frames are newline-delimited. Keep the trailing partial line.
    int newline = -1;
    while ((newline = m_sseBuffer.indexOf('\n')) != -1) {
        QByteArray line = m_sseBuffer.left(newline);
        m_sseBuffer.remove(0, newline + 1);
        if (line.endsWith('\r'))
            line.chop(1);
        consumeSseLine(line);
    }
}

void OllamaClient::consumeSseLine(const QByteArray &line)
{
    if (line.isEmpty())
        return; // frame separator
    if (line.startsWith(':'))
        return; // comment / keep-alive
    if (!line.startsWith("data:"))
        return; // event:/id:/retry: are not used by the OpenAI schema

    const QByteArray data = line.mid(5).trimmed();
    if (data.isEmpty())
        return;

    if (data == "[DONE]") {
        m_sawDone = true;
        return;
    }

    QJsonParseError parseError{};
    const QJsonDocument doc = QJsonDocument::fromJson(data, &parseError);
    if (parseError.error != QJsonParseError::NoError || !doc.isObject())
        return; // tolerate garbage rather than aborting a live stream

    const QJsonObject root = doc.object();

    // Some runtimes surface errors inside the stream body with HTTP 200.
    if (root.contains(QStringLiteral("error"))) {
        const QJsonValue err = root.value(QStringLiteral("error"));
        const QString message = err.isObject()
            ? err.toObject().value(QStringLiteral("message")).toString()
            : err.toString();
        fail(message.isEmpty() ? QStringLiteral("runtime returned an error") : message);
        return;
    }

    const QJsonArray choices = root.value(QStringLiteral("choices")).toArray();
    if (choices.isEmpty())
        return;

    const QJsonObject choice = choices.at(0).toObject();
    const QJsonObject delta = choice.value(QStringLiteral("delta")).toObject();

    QString token = delta.value(QStringLiteral("content")).toString();
    if (token.isEmpty()) {
        // Non-streaming fallback shape: choices[0].message.content
        token = choice.value(QStringLiteral("message"))
                    .toObject()
                    .value(QStringLiteral("content"))
                    .toString();
    }

    if (!token.isEmpty()) {
        m_assistantAccumulator += token;
        emit tokenReceived(token);
        return;
    }

    // Thinking phase: content is empty while the model streams `reasoning`
    // (Ollama/qwen3) or `reasoning_content` (some OpenAI-compatible servers).
    // Surface it so the UI is not silent, but keep it out of the history.
    QString reasoning = delta.value(QStringLiteral("reasoning")).toString();
    if (reasoning.isEmpty())
        reasoning = delta.value(QStringLiteral("reasoning_content")).toString();
    if (!reasoning.isEmpty())
        emit reasoningReceived(reasoning);
}

void OllamaClient::onFinished()
{
    if (!m_reply)
        return;

    const QNetworkReply::NetworkError error = m_reply->error();
    const int httpStatus =
        m_reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    const QString errorString = m_reply->errorString();
    const QByteArray tail = m_reply->readAll();

    if (!tail.isEmpty()) {
        m_sseBuffer.append(tail);
        int newline = -1;
        while ((newline = m_sseBuffer.indexOf('\n')) != -1) {
            QByteArray line = m_sseBuffer.left(newline);
            m_sseBuffer.remove(0, newline + 1);
            if (line.endsWith('\r'))
                line.chop(1);
            consumeSseLine(line);
        }
    }
    if (!m_sseBuffer.isEmpty()) {
        consumeSseLine(m_sseBuffer);
        m_sseBuffer.clear();
    }

    teardownReply();

    if (error == QNetworkReply::OperationCanceledError) {
        setStatus(QStringLiteral("cancelled"));
        emit responseFinished();
        return;
    }

    if (error != QNetworkReply::NoError) {
        fail(httpStatus > 0
                 ? QStringLiteral("HTTP %1: %2").arg(httpStatus).arg(errorString)
                 : errorString);
        return;
    }

    if (!m_assistantAccumulator.isEmpty()) {
        QJsonObject assistantTurn;
        assistantTurn.insert(QStringLiteral("role"), QStringLiteral("assistant"));
        assistantTurn.insert(QStringLiteral("content"), m_assistantAccumulator);
        m_history.append(assistantTurn);
    } else if (!m_sawDone) {
        fail(QStringLiteral("stream ended without any content"));
        return;
    }

    setStatus(QStringLiteral("idle"));
    emit responseFinished();
}
