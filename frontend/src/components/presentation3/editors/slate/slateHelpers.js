
export const convertTextToSlate = (text) => {
    if (!text) {
        return [
            {
                type: "paragraph",
                children: [{ text: "" }],
            },
        ];
    }

    // Handle HTML-like content from previous implementation (if any)
    // Our previous implementation used innerHTML which might have <ul><li> or <br>
    // For simplicity, we'll strip tags or treat as plain text for the conversion
    // but a simple approach for "text" field is usually plain text.

    const lines = text.split(/\r?\n|<br\s*\/?>/i);
    return lines.map(line => ({
        type: "paragraph",
        children: [{ text: line.replace(/<[^>]*>?/gm, '') }], // Strip HTML tags
    }));
};

export const createInitialValue = () => [
    {
        type: "paragraph",
        children: [{ text: "" }],
    },
];
