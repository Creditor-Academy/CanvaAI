import React from "react";
import usePresentationStore from "../store/usePresentationStore";
import SlateTextEditor from "../editors/slate/SlateTextEditor";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";

const FALLBACK_SLATE = [{ type: "paragraph", children: [{ text: "" }] }];

const TableLayer = ({ layer }) => {
    const {
        updateTableCell,
        editingCell,
        setEditingCell
    } = usePresentationStore();

    const resolveCell = (rawCell) => {
        if (!rawCell) {
            return {
                content: FALLBACK_SLATE,
                fontFamily: "Arial",
                fontSize: 14,
                textAlign: "center",
                color: "#ffffff"
            };
        }

        if (typeof rawCell === "string") {
            return {
                content: [{ type: "paragraph", children: [{ text: rawCell }] }],
                fontFamily: "Arial",
                fontSize: 14,
                textAlign: "center",
                color: "#ffffff"
            };
        }

        const isSlateValid =
            Array.isArray(rawCell.content) &&
            rawCell.content[0]?.type &&
            Array.isArray(rawCell.content[0]?.children);

        return {
            content: isSlateValid ? rawCell.content : FALLBACK_SLATE,
            fontFamily: rawCell.fontFamily || "Arial",
            fontSize: rawCell.fontSize || 14,
            textAlign: rawCell.textAlign || "center",
            color: rawCell.color || "#ffffff"
        };
    };

    const rows = layer.rows || 0;
    const cols = layer.cols || 0;
    const borderWidth = layer.borderWidth || 1;
    const borderColor = layer.borderColor || "#000000";

    const safeGrid = Array.isArray(layer.cells) && layer.cells.length === rows
        ? layer.cells
        : Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                border: `${borderWidth}px solid ${borderColor}`,
                boxSizing: "border-box",
                backgroundColor: layer.tableBgColor || "transparent",
            }}
        >
            {safeGrid.map((row, r) => {
                const safeRow = Array.isArray(row) ? row : Array.from({ length: cols }, () => null);
                return safeRow.map((rawCell, c) => {
                    const cell = resolveCell(rawCell);
                    const isEditing =
                        editingCell?.tableId === layer.id &&
                        editingCell?.row === r &&
                        editingCell?.col === c;

                    const cellStyle = {
                        border: `${borderWidth}px solid ${borderColor}`,
                        padding: "6px",
                        overflow: "hidden",
                        color: cell.color,
                        fontFamily: cell.fontFamily,
                        fontSize: `${cell.fontSize}px`,
                        textAlign: cell.textAlign,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                    };

                    const safeValue = Array.isArray(cell.content) ? cell.content : FALLBACK_SLATE;

                    return (
                        <div
                            key={`${r}-${c}`}
                            onMouseDown={(e) => {
                                if (isEditing) e.stopPropagation();
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({ tableId: layer.id, row: r, col: c });
                            }}
                            style={cellStyle}
                        >
                            {isEditing ? (
                                <SlateTextEditor
                                    value={safeValue}
                                    onChange={(newValue) =>
                                        updateTableCell(layer.id, r, c, { content: newValue })
                                    }
                                    style={{
                                        fontFamily: cell.fontFamily,
                                        fontSize: `${cell.fontSize}px`,
                                        textAlign: cell.textAlign,
                                        color: cell.color
                                    }}
                                />
                            ) : (
                                <SlateStaticRenderer
                                    value={safeValue}
                                    style={{
                                        fontFamily: cell.fontFamily,
                                        fontSize: `${cell.fontSize}px`,
                                        textAlign: cell.textAlign,
                                        color: cell.color
                                    }}
                                />
                            )}
                        </div>
                    );
                });
            })}
        </div>
    );
};

export default TableLayer;
