/**
 * Pagination Test Data Generator
 * 
 * Generate realistic test data for pagination testing
 */

import { USABLE_HEIGHT_PX, MIN_WIDOW_ORPHAN_HEIGHT } from './constants';

// ============================================================================
// CONTENT TEMPLATES
// ============================================================================

const LOREM_IPSUM = [
  'Lorem ipsum dolor sit amet',
  'consectetur adipiscing elit',
  'sed do eiusmod tempor incididunt',
  'ut labore et dolore magna aliqua',
  'Ut enim ad minim veniam',
  'quis nostrud exercitation ullamco',
  'laboris nisi ut aliquip ex ea commodo consequat',
  'Duis aute irure dolor in reprehenderit',
  'voluptate velit esse cillum dolore eu fugiat nulla pariatur',
  'Excepteur sint occaecat cupidatat non proident',
];

const BUSINESS_TEXT = [
  'This quarterly report demonstrates comprehensive business metrics',
  'Our analysis shows significant growth in key performance indicators',
  'The strategic initiatives have yielded positive results across all departments',
  'Market conditions remain favorable for continued expansion',
  'We recommend maintaining current investment levels',
  'Customer satisfaction scores have improved substantially',
  'Revenue projections exceed initial expectations',
  'Operational efficiency gains contribute to margin improvement',
];

const TECHNICAL_TEXT = [
  'The implementation utilizes advanced algorithms for optimal performance',
  'System architecture follows microservices design patterns',
  'API endpoints are RESTful and support JSON serialization',
  'Database queries are optimized with proper indexing',
  'Caching strategies reduce latency and improve user experience',
  'Security measures include authentication and authorization layers',
  'Monitoring and logging provide comprehensive system observability',
  'Scalability is achieved through horizontal partitioning',
];

// ============================================================================
// NODE GENERATORS
// ============================================================================

/**
 * Generate a paragraph node with random content
 */
export const generateParagraphNode = (options = {}) => {
  const {
    minLength = 20,
    maxLength = 200,
    template = null,
    height = null,
  } = options;
  
  let text;
  if (template) {
    text = template;
  } else {
    const sentences = [];
    const numSentences = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numSentences; i++) {
      sentences.push(LOREM_IPSUM[Math.floor(Math.random() * LOREM_IPSUM.length)]);
    }
    text = sentences.join(', ') + '.';
    
    // Adjust length
    if (text.length < minLength) {
      text = text + ' ' + 'Additional content. '.repeat(Math.ceil((minLength - text.length) / 20));
    }
    if (text.length > maxLength) {
      text = text.substring(0, maxLength).trim() + '...';
    }
  }
  
  return {
    type: { name: 'paragraph' },
    textContent: text,
    attrs: {},
    content: [{ type: 'text', text: text }],
    _mockHeight: height || Math.floor(Math.random() * 60) + 40,
  };
};

/**
 * Generate a heading node
 */
export const generateHeadingNode = (level = 1, text = null, height = null) => {
  const headingText = text || `Section ${level}.${Math.floor(Math.random() * 10)}`;
  
  return {
    type: { name: 'heading' },
    textContent: headingText,
    attrs: { level },
    content: [{ type: 'text', text: headingText }],
    _mockHeight: height || (level === 1 ? 50 : level === 2 ? 40 : 30),
  };
};

/**
 * Generate an image node
 */
export const generateImageNode = (options = {}) => {
  const {
    width = 400,
    height = 300,
    caption = null,
  } = options;
  
  return {
    type: { name: 'image' },
    textContent: '',
    attrs: {
      src: `image-${Date.now()}-${Math.random()}.jpg`,
      alt: caption || 'Generated image',
      width,
      height,
    },
    content: [],
    _mockHeight: height + (caption ? 30 : 0),
  };
};

/**
 * Generate a code block node
 */
export const generateCodeBlockNode = (code = null, language = 'javascript', height = null) => {
  const codeContent = code || `function example() {\n  console.log('Hello World');\n  return true;\n}`;
  
  return {
    type: { name: 'codeBlock' },
    textContent: codeContent,
    attrs: { language },
    content: [{ type: 'text', text: codeContent }],
    _mockHeight: height || (codeContent.split('\n').length * 20 + 20),
  };
};

/**
 * Generate a table node
 */
export const generateTableNode = (rows = 5, cols = 3, height = null) => {
  return {
    type: { name: 'table' },
    textContent: '',
    attrs: { rows, cols },
    content: [],
    _mockHeight: height || (rows * 30 + 20),
  };
};

/**
 * Generate a divider node
 */
export const generateDividerNode = () => ({
  type: { name: 'divider' },
  textContent: '',
  attrs: {},
  content: [],
  _mockHeight: 20,
});

/**
 * Generate a list item node
 */
export const generateListItemNode = (text = null, height = null) => {
  const itemText = text || `List item ${Math.floor(Math.random() * 100)}`;
  
  return {
    type: { name: 'listItem' },
    textContent: itemText,
    attrs: {},
    content: [{ type: 'text', text: itemText }],
    _mockHeight: height || 30,
  };
};

// ============================================================================
// DOCUMENT GENERATORS
// ============================================================================

/**
 * Generate a complete article structure
 */
export const generateArticle = (options = {}) => {
  const {
    title = 'Sample Article',
    sectionCount = 5,
    paragraphsPerSection = 8,
    includeImages = true,
    includeCode = false,
  } = options;
  
  const nodes = [];
  
  // Title
  nodes.push(generateHeadingNode(1, title, 60));
  
  // Introduction
  nodes.push(generateParagraphNode({ minLength: 100, maxLength: 300 }));
  
  // Sections
  for (let i = 0; i < sectionCount; i++) {
    nodes.push(generateHeadingNode(2, `Section ${i + 1}`, 45));
    
    for (let j = 0; j < paragraphsPerSection; j++) {
      nodes.push(generateParagraphNode());
      
      // Occasionally add images
      if (includeImages && Math.random() > 0.7) {
        nodes.push(generateImageNode({ height: 250 }));
      }
      
      // Add code blocks if requested
      if (includeCode && Math.random() > 0.8) {
        nodes.push(generateCodeBlockNode());
      }
    }
  }
  
  return nodes;
};

/**
 * Generate a business report
 */
export const generateBusinessReport = (options = {}) => {
  const {
    chapters = 3,
    sectionsPerChapter = 4,
  } = options;
  
  const nodes = [];
  
  // Main title
  nodes.push(generateHeadingNode(1, 'Quarterly Business Report', 70));
  
  // Executive summary
  nodes.push(generateHeadingNode(2, 'Executive Summary', 45));
  for (let i = 0; i < 5; i++) {
    nodes.push(generateParagraphNode({ template: BUSINESS_TEXT[i % BUSINESS_TEXT.length] }));
  }
  
  // Chapters
  for (let chapter = 0; chapter < chapters; chapter++) {
    nodes.push(generateHeadingNode(1, `Chapter ${chapter + 1}: Analysis`, 60));
    
    for (let section = 0; section < sectionsPerChapter; section++) {
      nodes.push(generateHeadingNode(2, `Section ${section + 1}`, 40));
      
      for (let para = 0; para < 6; para++) {
        nodes.push(generateParagraphNode({ template: BUSINESS_TEXT[(chapter + section + para) % BUSINESS_TEXT.length] }));
      }
      
      // Add chart/table
      if (section % 2 === 0) {
        nodes.push(generateTableNode(8, 4, 260));
      }
    }
  }
  
  return nodes;
};

/**
 * Generate technical documentation
 */
export const generateTechnicalDoc = (options = {}) => {
  const {
    apiEndpoints = 10,
    includeExamples = true,
  } = options;
  
  const nodes = [];
  
  nodes.push(generateHeadingNode(1, 'API Documentation', 60));
  nodes.push(generateParagraphNode({ minLength: 50, maxLength: 150 }));
  
  for (let i = 0; i < apiEndpoints; i++) {
    nodes.push(generateHeadingNode(2, `Endpoint ${i + 1}: /api/resource/${i}`, 45));
    nodes.push(generateParagraphNode({ template: TECHNICAL_TEXT[i % TECHNICAL_TEXT.length] }));
    
    if (includeExamples) {
      nodes.push(generateHeadingNode(3, 'Example', 35));
      nodes.push(generateCodeBlockNode(
        `fetch('/api/resource/${i}')\n  .then(res => res.json())\n  .then(data => console.log(data));`,
        'javascript',
        80
      ));
    }
    
    nodes.push(generateDividerNode());
  }
  
  return nodes;
};

/**
 * Generate a long-form narrative
 */
export const generateNarrative = (options = {}) => {
  const {
    chapters = 5,
    paragraphsPerChapter = 20,
  } = options;
  
  const nodes = [];
  
  nodes.push(generateHeadingNode(1, 'A Long Story', 60));
  
  for (let chapter = 0; chapter < chapters; chapter++) {
    nodes.push(generateHeadingNode(2, `Chapter ${chapter + 1}`, 50));
    
    for (let para = 0; para < paragraphsPerChapter; para++) {
      nodes.push(generateParagraphNode({ minLength: 80, maxLength: 250 }));
    }
    
    nodes.push(generateDividerNode());
  }
  
  return nodes;
};

/**
 * Generate mixed media gallery
 */
export const generateMediaGallery = (options = {}) => {
  const {
    itemCount = 15,
  } = options;
  
  const nodes = [];
  
  nodes.push(generateHeadingNode(1, 'Photo Gallery', 60));
  
  for (let i = 0; i < itemCount; i++) {
    nodes.push(generateImageNode({
      width: 400 + Math.floor(Math.random() * 200),
      height: 300 + Math.floor(Math.random() * 200),
      caption: `Image ${i + 1}`,
    }));
    
    nodes.push(generateParagraphNode({ minLength: 30, maxLength: 100 }));
    
    if (i % 3 === 0) {
      nodes.push(generateDividerNode());
    }
  }
  
  return nodes;
};

/**
 * Generate FAQ page
 */
export const generateFAQ = (options = {}) => {
  const {
    questionCount = 20,
  } = options;
  
  const nodes = [];
  
  nodes.push(generateHeadingNode(1, 'Frequently Asked Questions', 60));
  
  for (let i = 0; i < questionCount; i++) {
    nodes.push(generateHeadingNode(3, `Q${i + 1}: What is the answer to question ${i + 1}?`, 35));
    nodes.push(generateParagraphNode({ minLength: 50, maxLength: 200 }));
    
    if (i % 5 === 0) {
      nodes.push(generateDividerNode());
    }
  }
  
  return nodes;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate total estimated height of nodes
 */
export const calculateTotalHeight = (nodes) => {
  return nodes.reduce((total, node) => {
    return total + (node._mockHeight || 50);
  }, 0);
};

/**
 * Estimate number of pages needed
 */
export const estimatePageCount = (nodes) => {
  const totalHeight = calculateTotalHeight(nodes);
  return Math.ceil(totalHeight / USABLE_HEIGHT_PX);
};

/**
 * Generate nodes to fill specific number of pages
 */
export const generateNodesForPages = (pageCount, options = {}) => {
  const targetHeight = pageCount * USABLE_HEIGHT_PX;
  const nodes = [];
  let currentHeight = 0;
  
  while (currentHeight < targetHeight) {
    const node = generateParagraphNode();
    nodes.push(node);
    currentHeight += node._mockHeight;
  }
  
  return nodes;
};

/**
 * Create variation of existing nodes
 */
export const createVariation = (nodes, variationPercent = 10) => {
  return nodes.map(node => {
    if (Math.random() * 100 < variationPercent) {
      // Modify this node
      const newNode = { ...node };
      if (newNode._mockHeight) {
        const variation = (Math.random() - 0.5) * 0.2 * newNode._mockHeight;
        newNode._mockHeight = Math.max(20, Math.round(newNode._mockHeight + variation));
      }
      return newNode;
    }
    return node;
  });
};

export default {
  // Generators
  generateParagraphNode,
  generateHeadingNode,
  generateImageNode,
  generateCodeBlockNode,
  generateTableNode,
  generateDividerNode,
  generateListItemNode,
  // Documents
  generateArticle,
  generateBusinessReport,
  generateTechnicalDoc,
  generateNarrative,
  generateMediaGallery,
  generateFAQ,
  // Utilities
  calculateTotalHeight,
  estimatePageCount,
  generateNodesForPages,
  createVariation,
};
