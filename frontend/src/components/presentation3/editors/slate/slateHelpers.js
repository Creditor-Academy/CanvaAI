
export const convertTextToSlate = (text) => {
    if (!text) {
        return [
            {
                type: "paragraph",
                children: [{ text: "" }],
            },
        ];
    }

    const lines = text.split(/\r?\n|<br\s*\/?>/i);
    return lines.map(line => ({
        type: "paragraph",
        children: [{ text: line.replace(/<[^>]*>?/gm, '') }],
    }));
};

export const createInitialValue = () => [
    {
        type: "paragraph",
        children: [{ text: "" }],
    },
];

/**
 * AI often sends bulleted/numbered lists with text leaves directly under the list node.
 * Slate expects list-item wrappers. This normalizes the tree in place.
 */
export const normalizeSlateListContent = (nodes) => {
    if (!Array.isArray(nodes)) return nodes;

    return nodes.map((node) => {
        if (!node || typeof node !== "object") return node;

        if (node.type === "bulleted-list" || node.type === "numbered-list") {
            const children = Array.isArray(node.children) ? node.children : [];
            const normalizedChildren = children.map((child) => {
                if (!child) return null;
                if (child.type === "list-item") {
                    return {
                        ...child,
                        children: Array.isArray(child.children)
                            ? child.children.map((c) =>
                                  c?.text !== undefined ? c : { text: "", ...c }
                              )
                            : [{ text: "" }],
                    };
                }
                if (child.text !== undefined) {
                    const { text, ...marks } = child;
                    if (String(text).trim() === "") return null;
                    return {
                        type: "list-item",
                        children: [{ text, ...marks }],
                    };
                }
                return child;
            }).filter(Boolean);

            return {
                ...node,
                children:
                    normalizedChildren.length > 0
                        ? normalizedChildren
                        : [{ type: "list-item", children: [{ text: "" }] }],
            };
        }

        if (Array.isArray(node.children)) {
            return {
                ...node,
                children: normalizeSlateListContent(node.children),
            };
        }

        return node;
    });
};
