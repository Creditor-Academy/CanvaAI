import React from "react";

const Leaf = ({ attributes, children, leaf }) => {
    const style = {
        fontWeight: leaf.bold ? 'bold' : 'normal',
        fontStyle: leaf.italic ? 'italic' : 'normal',
        textDecoration: leaf.underline ? 'underline' : 'none',
        fontSize: leaf.fontSize ? `${leaf.fontSize}px` : undefined,
        color: leaf.color ? leaf.color : undefined,
        fontFamily: leaf.fontFamily ? leaf.fontFamily : undefined,
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

export const SlateStaticRenderer = ({ value }) => {
    if (!value || !Array.isArray(value)) return null;

    return (
        <div className="slate-static-content">
            {value.map((node, i) => renderNode(node, i))}
        </div>
    );
};

const renderNode = (node, index) => {
    if (node.text !== undefined) {
        const style = {
            fontWeight: node.bold ? 'bold' : undefined,
            fontStyle: node.italic ? 'italic' : undefined,
            textDecoration: node.underline ? 'underline' : undefined,
            fontSize: node.fontSize ? `${node.fontSize}px` : undefined,
            color: node.color ? node.color : undefined,
            fontFamily: node.fontFamily ? node.fontFamily : undefined,
        };

        return (
            <span key={index} style={style}>
                {node.text || "\u00A0"}
            </span>
        );
    }

    const children = node.children.map((child, i) => renderNode(child, i));

    switch (node.type) {
        case "bulleted-list":
            return <ul key={index} style={{ listStyleType: 'disc', marginLeft: '20px', margin: 0, textAlign: node.textAlign || 'inherit' }}>{children}</ul>;
        case "numbered-list":
            return <ol key={index} style={{ listStyleType: 'decimal', marginLeft: '20px', margin: 0, textAlign: node.textAlign || 'inherit' }}>{children}</ol>;
        case "list-item":
            return <li key={index} style={{ textAlign: node.textAlign || 'inherit' }}>{children}</li>;
        default:
            return (
                <div key={index} style={{ margin: 0, minHeight: '1.2em', textAlign: node.textAlign || 'inherit' }}>
                    {children.length > 0 ? children : <br />}
                </div>
            );
    }
};

export { Leaf, Element };