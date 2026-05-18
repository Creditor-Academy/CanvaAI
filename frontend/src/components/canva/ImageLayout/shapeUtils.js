// Shared shape SVG utilities for image template previews

export const isTransparent = (color) => {
    if (!color) return true;
    const c = color.replace(/\s/g, '').toLowerCase();
    return (
        c === 'transparent' ||
        c === 'rgba(0,0,0,0)' ||
        c === 'rgba(0,0,0,0.0)'
    );
};

// SVG Shape generators - supports all shape types
export const getShapeSVG = (shape, width, height, fillColor, strokeColor, strokeWidth) => {
    const w = width, h = height;
    const fill = isTransparent(fillColor) ? 'none' : fillColor;
    const stroke = strokeColor || '#000000';
    const sw = strokeWidth || 1;

    const generatePolygonPoints = (sides, radius, offsetAngle = 0) => {
        const points = [];
        const cx = w / 2, cy = h / 2;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) + offsetAngle;
            points.push(
                cx + radius * Math.cos(angle),
                cy + radius * Math.sin(angle)
            );
        }
        return points.join(',');
    };

    const svgPath = {
        line: `M0,${h / 2} L${w},${h / 2}`,
        rectangle: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
        circle: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        ellipse: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        triangle: `M${w / 2},0 L${w},${h} L0,${h} Z`,
        rightTriangle: `M0,0 L${w},0 L0,${h} Z`,
        star: `M${w / 2},${h * 0.1} L${w * 0.37},${h * 0.35} L${w * 0.1},${h * 0.35} L${w * 0.35},${h * 0.57} L${w * 0.2},${h * 0.9} L${w / 2},${h * 0.68} L${w * 0.8},${h * 0.9} L${w * 0.65},${h * 0.57} L${w * 0.9},${h * 0.35} L${w * 0.63},${h * 0.35} Z`,
        star6: (() => {
            const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
            let points = [];
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI) / 6;
                const radius = i % 2 === 0 ? r : r * 0.5;
                points.push(
                    cx + radius * Math.cos(angle - Math.PI / 2),
                    cy + radius * Math.sin(angle - Math.PI / 2)
                );
            }
            return `M${points.join(' L')} Z`;
        })(),
        heart: `M${w / 2},${h * 0.9} C${w * 0.2},${h * 0.7} ${w * 0.1},${h * 0.5} ${w * 0.1},${h * 0.35} C${w * 0.1},${h * 0.15} ${w * 0.25},${h * 0.05} ${w * 0.35},${h * 0.05} Q${w * 0.45},${h * 0.05} ${w / 2},${h * 0.2} L${w / 2},${h * 0.2} Q${w / 2},${h * 0.2} ${w * 0.55},${h * 0.05} C${w * 0.65},${h * 0.05} ${w * 0.75},${h * 0.05} ${w * 0.9},${h * 0.15} C${w * 0.9},${h * 0.35} ${w * 0.9},${h * 0.5} ${w * 0.8},${h * 0.7} L${w / 2},${h * 0.9} Z`,
        diamond: `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`,
        pentagon: (() => {
            const points = generatePolygonPoints(5, Math.min(w, h) / 2, -Math.PI / 2);
            return `M${points} Z`;
        })(),
        hexagon: (() => {
            const points = generatePolygonPoints(6, Math.min(w, h) / 2);
            return `M${points} Z`;
        })(),
        arrow: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        arrowLeft: `M${w * 0.1},${h / 2} L${w * 0.4},${h * 0.3} L${w * 0.4},${h * 0.45} L${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.55} L${w * 0.4},${h * 0.55} L${w * 0.4},${h * 0.7} Z`,
        arrowUp: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.4} L${w * 0.55},${h * 0.4} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.4} L${w * 0.3},${h * 0.4} Z`,
        arrowDown: `M${w / 2},${h * 0.9} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.1} L${w * 0.45},${h * 0.1} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        cloud: `M${w * 0.3},${h * 0.6} C${w * 0.3},${h * 0.4} ${w * 0.45},${h * 0.2} ${w * 0.65},${h * 0.2} C${w * 0.8},${h * 0.2} ${w * 0.9},${h * 0.3} ${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.6} C${w * 0.95},${h * 0.6} ${w},${h * 0.65} ${w},${h * 0.75} L${w},${h * 0.85} C${w},${h * 0.92} ${w * 0.93},${h} ${w * 0.85},${h} L${w * 0.15},${h} C${w * 0.07},${h} ${w * 0},${h * 0.92} ${w * 0},${h * 0.85} L${w * 0},${h * 0.75} C${w * 0},${h * 0.65} ${w * 0.05},${h * 0.6} ${w * 0.1},${h * 0.6} C${w * 0.1},${h * 0.35} ${w * 0.2},${h * 0.2} ${w * 0.3},${h * 0.2} C${w * 0.15},${h * 0.2} ${w * 0.1},${h * 0.3} ${w * 0.1},${h * 0.4}`,
        roundedRectangle: `M${w * 0.1},0 L${w * 0.9},0 Q${w},0 ${w},${h * 0.1} L${w},${h * 0.9} Q${w},${h} ${w * 0.9},${h} L${w * 0.1},${h} Q0,${h} 0,${h * 0.9} L0,${h * 0.1} Q0,0 ${w * 0.1},0`
    };

    const pathData = svgPath[shape] || svgPath.roundedRectangle;

    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible;">
        <path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"/>
    </svg>`;
};

// Returns the SVG path data string for a given shape (for inline SVG usage)
export const getShapePath = (shape, width, height) => {
    const w = width, h = height;

    const generatePolygonPoints = (sides, radius, offsetAngle = 0) => {
        const points = [];
        const cx = w / 2, cy = h / 2;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) + offsetAngle;
            points.push(
                cx + radius * Math.cos(angle),
                cy + radius * Math.sin(angle)
            );
        }
        return points.join(',');
    };

    const svgPath = {
        line: `M0,${h / 2} L${w},${h / 2}`,
        rectangle: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
        circle: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        ellipse: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        triangle: `M${w / 2},0 L${w},${h} L0,${h} Z`,
        rightTriangle: `M0,0 L${w},0 L0,${h} Z`,
        star: `M${w / 2},${h * 0.1} L${w * 0.37},${h * 0.35} L${w * 0.1},${h * 0.35} L${w * 0.35},${h * 0.57} L${w * 0.2},${h * 0.9} L${w / 2},${h * 0.68} L${w * 0.8},${h * 0.9} L${w * 0.65},${h * 0.57} L${w * 0.9},${h * 0.35} L${w * 0.63},${h * 0.35} Z`,
        star6: (() => {
            const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
            let points = [];
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI) / 6;
                const radius = i % 2 === 0 ? r : r * 0.5;
                points.push(
                    cx + radius * Math.cos(angle - Math.PI / 2),
                    cy + radius * Math.sin(angle - Math.PI / 2)
                );
            }
            return `M${points.join(' L')} Z`;
        })(),
        heart: `M${w / 2},${h * 0.9} C${w * 0.2},${h * 0.7} ${w * 0.1},${h * 0.5} ${w * 0.1},${h * 0.35} C${w * 0.1},${h * 0.15} ${w * 0.25},${h * 0.05} ${w * 0.35},${h * 0.05} Q${w * 0.45},${h * 0.05} ${w / 2},${h * 0.2} L${w / 2},${h * 0.2} Q${w / 2},${h * 0.2} ${w * 0.55},${h * 0.05} C${w * 0.65},${h * 0.05} ${w * 0.75},${h * 0.05} ${w * 0.9},${h * 0.15} C${w * 0.9},${h * 0.35} ${w * 0.9},${h * 0.5} ${w * 0.8},${h * 0.7} L${w / 2},${h * 0.9} Z`,
        diamond: `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`,
        pentagon: (() => {
            const points = generatePolygonPoints(5, Math.min(w, h) / 2, -Math.PI / 2);
            return `M${points} Z`;
        })(),
        hexagon: (() => {
            const points = generatePolygonPoints(6, Math.min(w, h) / 2);
            return `M${points} Z`;
        })(),
        arrow: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        arrowLeft: `M${w * 0.1},${h / 2} L${w * 0.4},${h * 0.3} L${w * 0.4},${h * 0.45} L${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.55} L${w * 0.4},${h * 0.55} L${w * 0.4},${h * 0.7} Z`,
        arrowUp: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.4} L${w * 0.55},${h * 0.4} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.4} L${w * 0.3},${h * 0.4} Z`,
        arrowDown: `M${w / 2},${h * 0.9} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.1} L${w * 0.45},${h * 0.1} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        cloud: `M${w * 0.3},${h * 0.6} C${w * 0.3},${h * 0.4} ${w * 0.45},${h * 0.2} ${w * 0.65},${h * 0.2} C${w * 0.8},${h * 0.2} ${w * 0.9},${h * 0.3} ${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.6} C${w * 0.95},${h * 0.6} ${w},${h * 0.65} ${w},${h * 0.75} L${w},${h * 0.85} C${w},${h * 0.92} ${w * 0.93},${h} ${w * 0.85},${h} L${w * 0.15},${h} C${w * 0.07},${h} ${w * 0},${h * 0.92} ${w * 0},${h * 0.85} L${w * 0},${h * 0.75} C${w * 0},${h * 0.65} ${w * 0.05},${h * 0.6} ${w * 0.1},${h * 0.6} C${w * 0.1},${h * 0.35} ${w * 0.2},${h * 0.2} ${w * 0.3},${h * 0.2} C${w * 0.15},${h * 0.2} ${w * 0.1},${h * 0.3} ${w * 0.1},${h * 0.4}`,
        roundedRectangle: `M${w * 0.1},0 L${w * 0.9},0 Q${w},0 ${w},${h * 0.1} L${w},${h * 0.9} Q${w},${h} ${w * 0.9},${h} L${w * 0.1},${h} Q0,${h} 0,${h * 0.9} L0,${h * 0.1} Q0,0 ${w * 0.1},0`
    };

    return svgPath[shape] || svgPath.roundedRectangle;
};
