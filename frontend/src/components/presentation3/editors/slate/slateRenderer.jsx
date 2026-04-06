import React from "react";

/* ============================= */
/* ========= LEAF ============== */
/* ============================= */

const Leaf = ({ attributes, children, leaf }) => {
  const style = {
    fontWeight: leaf.bold ? "bold" : "normal",
    fontStyle: leaf.italic ? "italic" : "normal",
    textDecoration: leaf.underline ? "underline" : "none",

    // If mark exists → use it
    // Otherwise → inherit from Editable wrapper
    fontSize: leaf.fontSize ? `${leaf.fontSize}px` : "inherit",
    color: leaf.color || "inherit",
    fontFamily: leaf.fontFamily || "inherit",
  };

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

/* ============================= */
/* ========= ELEMENT =========== */
/* ============================= */

const Element = ({ attributes, children, element }) => {
  const style = {
    textAlign: element.textAlign || "inherit",
    margin: 0,
  };

  switch (element.type) {
    case "bulleted-list":
      return (
        <ul
          {...attributes}
          className="bulleted-list"
          style={{
            ...style,
            listStyleType: "disc",
            marginLeft: "20px",
          }}
        >
          {children}
        </ul>
      );

    case "numbered-list":
      return (
        <ol
          {...attributes}
          className="numbered-list"
          style={{
            ...style,
            listStyleType: "decimal",
            paddingLeft: "1.5em",
            margin: 0,
          }}
        >
          {children}
        </ol>
      );

    case "list-item": {
      // Extract color and fontSize from the first text leaf so the ::marker
      // (the number / bullet symbol) matches the text content color exactly.
      const firstLeaf = element.children?.find((c) => c.text !== undefined);
      const markerColor = firstLeaf?.color || element.color || "inherit";
      const markerFontSize = firstLeaf?.fontSize || element.fontSize
        ? `${firstLeaf?.fontSize || element.fontSize}px`
        : "inherit";
      return (
        <li
          {...attributes}
          className="list-item"
          style={{
            ...style,
            color: markerColor,
            fontSize: markerFontSize,
          }}
        >
          {children}
        </li>
      );
    }

    default:
      return (
        <p {...attributes} style={style}>
          {children}
        </p>
      );
  }
};

/* ============================= */
/* ===== STATIC RENDERER ======= */
/* ============================= */

export const SlateStaticRenderer = ({ value, style }) => {
  if (!value || !Array.isArray(value)) return null;

  return (
    <div
      className="slate-static-content"
      style={{
        ...style,
      }}
    >
      {value.map((node, i) => renderNode(node, i))}
    </div>
  );
};

/* ============================= */
/* ===== NODE RENDERER ========= */
/* ============================= */

const renderNode = (node, index) => {
  if (node.text !== undefined) {
    return (
      <Leaf
        key={index}
        leaf={node}
        attributes={{ "data-slate-leaf": true }}
      >
        {node.text || "\u00A0"}
      </Leaf>
    );
  }

  const children = node.children?.map((child, i) =>
    renderNode(child, i)
  );

  return (
    <Element
      key={index}
      element={node}
      attributes={{ "data-slate-node": "element" }}
    >
      {children && children.length > 0 ? children : <br />}
    </Element>
  );
};

export { Leaf, Element };