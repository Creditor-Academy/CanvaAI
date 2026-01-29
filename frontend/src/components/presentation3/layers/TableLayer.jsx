import React from "react";
import usePresentationStore from "../store/usePresentationStore";

const TableLayer = ({ layer }) => {
    const { updateTableCell, saveToHistory } = usePresentationStore();

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${layer.cols}, 1fr)`,
                gridTemplateRows: `repeat(${layer.rows}, 1fr)`,
                border: `1px solid ${layer.borderColor || "#d1d5db"}`,
                background: "#fff",
                boxSizing: "border-box",
            }}
        >
            {layer.cells.map((row, r) =>
                row.map((cell, c) => (
                    <div
                        key={`${r}-${c}`}
                        contentEditable
                        suppressContentEditableWarning
                        style={{
                            border: "1px solid #e5e7eb",
                            padding: "6px",
                            fontSize: layer.fontSize || 14,
                            color: layer.color || "#000000",
                            fontWeight: layer.fontWeight || "normal",
                            fontStyle: layer.fontStyle || "normal",
                            textDecoration: layer.textDecoration || "none",
                            textAlign: layer.textAlign || "center",
                            outline: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: layer.textAlign === "left" ? "flex-start" : layer.textAlign === "right" ? "flex-end" : "center",
                            wordBreak: "break-word",
                            overflow: "hidden",
                            cursor: layer.link ? "pointer" : "text",
                        }}
                        onClick={(e) => {
                            if (layer.link && !e.target.isContentEditable) {
                                window.open(layer.link, "_blank", "noopener,noreferrer");
                            }
                        }}
                        onFocus={() => {
                            // We might want to save history on focus if we want to capture state before edit
                            // but let's stick to simple onBlur update for now as per prompt.
                        }}
                        onBlur={(e) => {
                            const newValue = e.target.innerText;
                            if (newValue !== cell) {
                                saveToHistory();
                                updateTableCell(layer.id, r, c, newValue);
                            }
                        }}
                    >
                        {cell}
                    </div>
                ))
            )}
        </div>
    );
};

export default TableLayer;
