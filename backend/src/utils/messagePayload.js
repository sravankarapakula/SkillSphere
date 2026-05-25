const MAX_MESSAGE_TEXT_LENGTH = 5000;

const normalizeAttachments = (attachments = []) => {
    if (!Array.isArray(attachments)) {
        return [];
    }

    return attachments
        .filter((attachment) => attachment && typeof attachment.url === "string" && attachment.url.trim())
        .map((attachment) => ({
            url: attachment.url.trim(),
            filename: typeof attachment.filename === "string" ? attachment.filename.trim() : undefined,
            mimetype: typeof attachment.mimetype === "string" ? attachment.mimetype.trim() : undefined
        }));
};

const normalizeMessagePayload = ({ text, attachments }) => {
    const normalizedText = typeof text === "string" ? text.trim() : "";
    const normalizedAttachments = normalizeAttachments(attachments);

    return {
        text: normalizedText,
        attachments: normalizedAttachments,
        hasContent: Boolean(normalizedText) || normalizedAttachments.length > 0
    };
};

const getLastMessageText = (text, attachments = []) => {
    if (text) {
        return text.substring(0, 100);
    }

    if (attachments.length === 1) {
        return attachments[0].filename || "Attachment";
    }

    return `${attachments.length} attachments`;
};

module.exports = {
    MAX_MESSAGE_TEXT_LENGTH,
    normalizeMessagePayload,
    getLastMessageText
};
