export const getShapeDisplayProps = (shape) => {
  switch (shape) {
    case 'line':
      return {
        borderRadius: '0',
        clipPath: 'none',
        isLineShape: true
      };
    case 'circle':
      return { borderRadius: '50%', clipPath: 'none' };
    case 'ellipse':
      return { borderRadius: '50% 50%', clipPath: 'none' };
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
      return {
        borderRadius: '0',
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        isSvgShape: true
      };
    case 'star6':
      return {
        borderRadius: '0',
        clipPath: 'polygon(50% 0%, 60% 25%, 100% 25%, 70% 50%, 85% 75%, 50% 60%, 15% 75%, 30% 50%, 0% 25%, 40% 25%)',
        isSvgShape: true
      };
    case 'heart':
      return {
        borderRadius: '0',
        clipPath: 'polygon(50% 100%, 0% 40%, 0% 30%, 15% 15%, 35% 10%, 50% 20%, 65% 10%, 85% 15%, 100% 30%, 100% 40%)',
        isSvgShape: true,
        pathData: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      };
    case 'arrow':
      return {
        borderRadius: '0',
        clipPath: 'polygon(0% 30%, 60% 30%, 60% 10%, 100% 50%, 60% 90%, 60% 70%, 0% 70%)',
        isSvgShape: true
      };
    case 'arrowLeft':
      return {
        borderRadius: '0',
        clipPath: 'polygon(100% 30%, 40% 30%, 40% 10%, 0% 50%, 40% 90%, 40% 70%, 100% 70%)',
        isSvgShape: true
      };
    case 'arrowUp':
      return {
        borderRadius: '0',
        clipPath: 'polygon(30% 100%, 30% 40%, 10% 40%, 50% 0%, 90% 40%, 70% 40%, 70% 100%)',
        isSvgShape: true
      };
    case 'arrowDown':
      return {
        borderRadius: '0',
        clipPath: 'polygon(30% 0%, 30% 60%, 10% 60%, 50% 100%, 90% 60%, 70% 60%, 70% 0%)',
        isSvgShape: true
      };
    case 'cloud':
      return {
        borderRadius: '0',
        clipPath: 'polygon(20% 50%, 0% 60%, 0% 80%, 15% 95%, 40% 100%, 70% 100%, 90% 95%, 100% 80%, 100% 60%, 85% 50%, 95% 35%, 80% 20%, 60% 15%, 40% 15%, 25% 20%, 15% 35%)',
        isSvgShape: true
      };
    default:
      return { borderRadius: '0', clipPath: 'none' };
  }
};