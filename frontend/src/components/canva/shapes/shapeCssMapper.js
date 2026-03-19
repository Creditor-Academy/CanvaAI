export const getShapeDisplayProps = (shape) => {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%', clipPath: 'none' };
    case 'ellipse':
      return { borderRadius: '50%', clipPath: 'none' };
    case 'roundedRectangle':
      return { borderRadius: '16px', clipPath: 'none' };
    case 'rectangle':
      return { borderRadius: '0', clipPath: 'none' };
    case 'triangle':
      return { borderRadius: '0', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' };
    case 'rightTriangle':
      return { borderRadius: '0', clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)' };
    case 'diamond':
      return { borderRadius: '0', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'pentagon':
      return { borderRadius: '0', clipPath: 'polygon(50% 0%, 95% 38%, 77% 100%, 23% 100%, 5% 38%)' };
    case 'hexagon':
      return { borderRadius: '0', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
    case 'star':
      return { borderRadius: '0', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
    case 'star6':
      return { borderRadius: '0', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
    case 'heart':
      return {
        borderRadius: '0',
        clipPath: 'none',
        isPathShape: true,
        pathData: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      };
    case 'arrow': // right
      return { borderRadius: '0', clipPath: 'polygon(0% 30%, 60% 30%, 60% 10%, 100% 50%, 60% 90%, 60% 70%, 0% 70%)' };
    case 'arrowLeft':
      return { borderRadius: '0', clipPath: 'polygon(100% 30%, 40% 30%, 40% 10%, 0% 50%, 40% 90%, 40% 70%, 100% 70%)' };
    case 'arrowUp':
      return { borderRadius: '0', clipPath: 'polygon(30% 100%, 30% 40%, 10% 40%, 50% 0%, 90% 40%, 70% 40%, 70% 100%)' };
    case 'arrowDown':
      return { borderRadius: '0', clipPath: 'polygon(30% 0%, 30% 60%, 10% 60%, 50% 100%, 90% 60%, 70% 60%, 70% 0%)' };
    case 'cloud':
      return {
        borderRadius: '0',
        clipPath: 'path("M20 60 C20 40, 40 40, 45 50 C50 35, 70 35, 75 50 C90 50, 95 60, 90 70 C85 80, 70 85, 60 80 C50 90, 35 90, 30 80 C15 80, 10 70, 20 60 Z")',
        isPathShape: true
      };
    default:
      return { borderRadius: '0', clipPath: 'none' };
  }
};