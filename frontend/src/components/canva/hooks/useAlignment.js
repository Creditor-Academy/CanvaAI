import { useState, useCallback } from 'react';

/**
 * Custom hook for calculating alignment guides (snap lines)
 * @param {Array} layers - List of all layers on the canvas
 * @param {Object} canvasSize - Dimensions of the canvas { width, height }
 * @param {number} threshold - Snap threshold in pixels (default: 5)
 */
export const useAlignment = (layers, canvasSize, threshold = 5) => {
    const [alignmentGuides, setAlignmentGuides] = useState({ x: [], y: [] });

    /**
     * Snaps a layer to other layers and canvas edges
     * @param {Object} activeLayer - The layer being dragged { x, y, width, height, id }
     * @returns {Object} - { x: snappedX, y: snappedY, guides: { x: [], y: [] } }
     */
    const snap = useCallback((activeLayer) => {
        const guides = { x: [], y: [] };
        let newX = activeLayer.x;
        let newY = activeLayer.y;

        // Define points of interest on the active layer
        const activeLeft = activeLayer.x;
        const activeCenter = activeLayer.x + activeLayer.width / 2;
        const activeRight = activeLayer.x + activeLayer.width;
        const activeTop = activeLayer.y;
        const activeMiddle = activeLayer.y + activeLayer.height / 2;
        const activeBottom = activeLayer.y + activeLayer.height;

        // Collect all snap targets (other layers + canvas edges/center)
        const targetsX = [
            { value: 0, type: 'canvas-start' }, // Canvas Left
            { value: canvasSize.width / 2, type: 'canvas-center' }, // Canvas Center
            { value: canvasSize.width, type: 'canvas-end' } // Canvas Right
        ];
        const targetsY = [
            { value: 0, type: 'canvas-start' }, // Canvas Top
            { value: canvasSize.height / 2, type: 'canvas-center' }, // Canvas Middle
            { value: canvasSize.height, type: 'canvas-end' } // Canvas Bottom
        ];

        layers.forEach(layer => {
            if (layer.id === activeLayer.id) return; // Skip self

            // Horizontal targets (X-axis alignment)
            targetsX.push(
                { value: layer.x, type: 'layer-edge' }, // Left
                { value: layer.x + layer.width / 2, type: 'layer-center' }, // Center
                { value: layer.x + layer.width, type: 'layer-edge' } // Right
            );

            // Vertical targets (Y-axis alignment)
            targetsY.push(
                { value: layer.y, type: 'layer-edge' }, // Top
                { value: layer.y + layer.height / 2, type: 'layer-center' }, // Middle
                { value: layer.y + layer.height, type: 'layer-edge' } // Bottom
            );
        });

        // --- CHECK HORIZONTAL SNAPPING (X-axis) ---
        // We check left edge, center, and right edge of active layer against targets
        let snappedX = false;

        // Check closest snap for X
        let minDiffX = threshold;
        let pendingSnapX = null;
        let guideLineX = null;

        // Helper to check alignment
        const checkX = (current, target, alignType) => {
            const diff = Math.abs(current - target.value);
            if (diff < minDiffX) {
                minDiffX = diff;
                // Calculate correction
                pendingSnapX = target.value - (current - activeLayer.x);
                // Guide line stays at the target value
                guideLineX = target.value;
            }
        };

        targetsX.forEach(target => {
            checkX(activeLeft, target, 'left');
            checkX(activeCenter, target, 'center');
            checkX(activeRight, target, 'right');
        });

        if (pendingSnapX !== null) {
            newX = pendingSnapX;
            guides.x.push(guideLineX);
            snappedX = true;
        }

        // --- CHECK VERTICAL SNAPPING (Y-axis) ---
        // We check top edge, middle, and bottom edge of active layer against targets
        let snappedY = false;
        let minDiffY = threshold;
        let pendingSnapY = null;
        let guideLineY = null;

        // Helper to check alignment
        const checkY = (current, target, alignType) => {
            const diff = Math.abs(current - target.value);
            if (diff < minDiffY) {
                minDiffY = diff;
                // Calculate correction
                pendingSnapY = target.value - (current - activeLayer.y);
                // Guide line stays at the target value
                guideLineY = target.value;
            }
        };

        targetsY.forEach(target => {
            checkY(activeTop, target, 'top');
            checkY(activeMiddle, target, 'middle');
            checkY(activeBottom, target, 'bottom');
        });

        if (pendingSnapY !== null) {
            newY = pendingSnapY;
            guides.y.push(guideLineY);
            snappedY = true;
        }

        return { x: newX, y: newY, guides };
    }, [layers, canvasSize, threshold]);

    const clearGuides = useCallback(() => {
        setAlignmentGuides({ x: [], y: [] });
    }, []);

    return { snap, alignmentGuides, setAlignmentGuides, clearGuides };
};
