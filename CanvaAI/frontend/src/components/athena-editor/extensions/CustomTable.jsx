import React, { useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';

// Custom table component that works with Tiptap
const CustomTable = ({ node, updateAttributes, editor }) => {
  const [tableData, setTableData] = useState(() => {
    // Initialize table data from node attributes
    const rows = node.attrs.rows || 3;
    const cols = node.attrs.cols || 3;
    
    // Create empty cells if they don't exist
    if (!node.attrs.cells || node.attrs.cells.length === 0) {
      const initialCells = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push('');
        }
        initialCells.push(row);
      }
      updateAttributes({ cells: initialCells });
      return initialCells;
    }
    
    return node.attrs.cells;
  });

  const updateTableCell = useCallback((rowIndex, colIndex, value) => {
    const newTableData = [...tableData];
    newTableData[rowIndex][colIndex] = value;
    
    setTableData(newTableData);
    updateAttributes({ cells: newTableData });
  }, [tableData, updateAttributes]);

  const handleCellChange = useCallback((rowIndex, colIndex, value) => {
    updateTableCell(rowIndex, colIndex, value);
  }, [updateTableCell]);

  const rows = node.attrs.rows || 3;
  const cols = node.attrs.cols || 3;

  return (
    <NodeViewWrapper className="custom-table-node">
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          border: "1px solid " + (node.attrs.borderColor || "#d1d5db"),
          background: node.attrs.backgroundColor || "#fff",
          boxSizing: "border-box",
          margin: "1em 0",
        }}
      >
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <div
              key={`${r}-${c}`}
              contentEditable
              suppressContentEditableWarning
              style={{
                border: "1px solid #e5e7eb",
                padding: "6px",
                fontSize: node.attrs.fontSize || 14,
                color: node.attrs.color || "#000000",
                fontWeight: node.attrs.fontWeight || "normal",
                fontStyle: node.attrs.fontStyle || "normal",
                textDecoration: node.attrs.textDecoration || "none",
                textAlign: node.attrs.textAlign || "left",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: node.attrs.textAlign === "left" ? "flex-start" : 
                             node.attrs.textAlign === "right" ? "flex-end" : "center",
                wordBreak: "break-word",
                overflow: "hidden",
                cursor: "text",
              }}
              onInput={(e) => {
                handleCellChange(r, c, e.target.textContent || '');
              }}
              dangerouslySetInnerHTML={{ __html: tableData[r]?.[c] || '' }}
            />
          ))
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default CustomTable;