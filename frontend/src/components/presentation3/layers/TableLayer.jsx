import React from "react";
import usePresentationStore from "../store/usePresentationStore";
import SlateTextEditor from "../editors/slate/SlateTextEditor";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";

const TableLayer = ({ layer }) => {
    const {
        updateTableCell,
        editingCell,
        setEditingCell
    } = usePresentationStore();

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${layer.cols}, 1fr)`,
                gridTemplateRows: `repeat(${layer.rows}, 1fr)`,
                border: `${layer.borderWidth || 0}px solid ${layer.borderColor || "#e5e7eb"}`,
                boxSizing: "border-box",
                backgroundColor: layer.tableBgColor || "transparent",
            }}
        >
            {layer.cells.map((row, r) =>
                row.map((cell, c) => {
                    // Safety check: cell should be an object now, but handle legacy string cases if needed?
                    // The prompt implies we move to new structure. Assuming new structure for now.
                    // OLD: cell = string. NEW: cell = { content, ... }
                    // If legacy data exists, we might crash accessing cell.content.
                    // Let's assume for this task we are creating NEW tables.
                    // Ideally we'd migrate, but for now we implement the new renderer.

                    // Check if this specific cell is being edited
                    const isEditing =
                        editingCell?.tableId === layer.id &&
                        editingCell?.row === r &&
                        editingCell?.col === c;

                    // Default styles from cell
                    const cellStyle = {
                        border: `${layer.borderWidth || 0}px solid ${layer.borderColor || "#e5e7eb"}`,
                        padding: "6px",
                        overflow: "hidden",
                        fontFamily: cell.fontFamily || "Arial",
                        fontSize: `${cell.fontSize || 14}px`,
                        textAlign: cell.textAlign || "center",
                        // Inherit from layer if cell prop missing (optional fallback, but prompts says cell has props)
                    };

                    return (
                        <div
                            key={`${r}-${c}`}
                            onMouseDown={(e) => {
                                if (isEditing) e.stopPropagation();
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation(); // Prevent layer selection logic from interfering
                                setEditingCell({ tableId: layer.id, row: r, col: c });
                            }}
                            style={cellStyle}
                        >
                            {isEditing ? (
                                <SlateTextEditor
                                    value={cell.content}
                                    onChange={(newValue) =>
                                        // Directly update content via deep update
                                        updateTableCell(layer.id, r, c, {
                                            content: newValue
                                        })
                                    }
                                    // We don't pass style to Editor wrapper usually, SlateTextEditor handles internal styles.
                                    // But we might need to pass wrapper styles if SlateTextEditor supports it.
                                    // Checking usage: SlateTextEditor takes style prop?
                                    // The prompt's example passes style={{ fontFamily... }} to Editor.
                                    style={{
                                        fontFamily: cell.fontFamily,
                                        fontSize: `${cell.fontSize}px`,
                                        textAlign: cell.textAlign
                                    }}
                                />
                            ) : (
                                <SlateStaticRenderer
                                    value={cell.content}
                                    style={{
                                        fontFamily: cell.fontFamily,
                                        fontSize: `${cell.fontSize}px`,
                                        textAlign: cell.textAlign
                                    }}
                                />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default TableLayer;
