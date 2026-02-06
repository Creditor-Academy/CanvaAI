import React from "react";

const Leaf = ({ attributes, children, leaf }) => {
    const style = {
        fontWeight: leaf.bold ? 'bold' : 'normal',
        fontStyle: leaf.italic ? 'italic' : 'normal',
        textDecoration: leaf.underline ? 'underline' : 'none',
        // Use mark if present, otherwise explicit inherit to avoid fallback
        fontSize: leaf.fontSize ? `${leaf.fontSize}px` : 'inherit',
        color: leaf.color ? leaf.color : 'inherit',
        fontFamily: leaf.fontFamily ? leaf.fontFamily : 'inherit',
    };

    return (
        <span {...attributes} style={style}>
            {children}
        </span>
    );
};

const Element = ({ attributes, children, element }) => {
    const style = {
        textAlign: element.textAlign || 'inherit',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        margin: 0
    };
    switch (element.type) {
        case "bulleted-list":
            return <ul {...attributes} style={{ ...style, listStyleType: 'disc', marginLeft: '20px' }}>{children}</ul>;
        case "numbered-list":
            return <ol {...attributes} style={{ ...style, listStyleType: 'decimal', marginLeft: '20px' }}>{children}</ol>;
        case "list-item":
            return <li {...attributes} style={style}>{children}</li>;
        default:
            return <p {...attributes} style={style}>{children}</p>;
    }
};

export const SlateStaticRenderer = ({ value, style }) => {
    if (!value || !Array.isArray(value)) return null;

    return (
        <div
            className="slate-static-content"
            style={{
                fontSize: 'inherit',
                fontFamily: 'inherit',
                textAlign: 'inherit',
                ...style
            }}
        >
            {value.map((node, i) => renderNode(node, i))}
        </div>
    );
};

const renderNode = (node, index) => {
    if (node.text !== undefined) {
        return (
            <Leaf
                key={index}
                leaf={node}
                attributes={{ 'data-slate-leaf': true }}
            >
                {node.text || "\u00A0"}
            </Leaf>
        );
    }

    const children = node.children.map((child, i) => renderNode(child, i));

    return (
        <Element
            key={index}
            element={node}
            attributes={{ 'data-slate-node': 'element' }}
        >
            {children.length > 0 ? children : <br />}
        </Element>
    );
};

export { Leaf, Element };