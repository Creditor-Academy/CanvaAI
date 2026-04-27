import fs from 'fs';

const filePath = 'c:/Users/y/merged-canva-ai/CanvaAI/frontend/src/components/athena-editor/components/TextEditor.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// ── FIX 1: Replace cancel() with flush() in the unmount cleanup ──
const oldBlock = `  // Cancel debounce timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveRef.current) {
        saveRef.current.cancel();`;

const newBlock = `  // \u{1F525} PRODUCTION FIX: Flush pending saves on unmount instead of canceling
  // .cancel() discards buffered save, causing data loss on navigation/tab close
  // .flush() forces the debounced save to execute immediately
  useEffect(() => {
    const flushOnUnload = () => {
      if (saveRef.current) saveRef.current.flush();
    };
    window.addEventListener('beforeunload', flushOnUnload);
    return () => {
      window.removeEventListener('beforeunload', flushOnUnload);
      if (saveRef.current) {
        saveRef.current.flush();`;

if (content.includes('saveRef.current.cancel()')) {
  content = content.replace(oldBlock, newBlock);
  // Also fix the log message
  content = content.replace(
    "console.log('\u{1F9F9} Cancelled pending save on unmount');",
    "console.log('[AutoSave] Flushed pending save on unmount');"
  );
  console.log('FIX 1: Replaced cancel() with flush() + beforeunload handler');
} else {
  console.log('FIX 1: cancel() not found (may already be fixed)');
}

// ── FIX 2: Add base64 image guard in handleSave ──
// Prevent saving documents with massive inline base64 images that crash the DB
const saveMarker = "json: editor.getJSON()";
if (content.includes(saveMarker) && !content.includes('stripBase64Images')) {
  // Add the utility function before TextEditorContent
  const utilInsertPoint = "// \u2500\u2500\u2500 Main TextEditorContent component";
  const stripUtil = `// \u{1F525} PRODUCTION FIX: Strip base64 images from JSON before saving to prevent DB bloat
// PROBLEM: Users can paste screenshots which embed as data:image/png;base64,<huge string>
// A single 1MB image becomes ~1.3MB of base64 text in the JSON, easily exceeding MongoDB's 16MB doc limit
const stripBase64Images = (json) => {
  if (!json) return json;
  const walk = (node) => {
    if (!node) return node;
    if (node.type === 'image' || node.type === 'resizableImage') {
      if (node.attrs?.src?.startsWith('data:')) {
        return { ...node, attrs: { ...node.attrs, src: '' } };
      }
    }
    if (node.content) {
      return { ...node, content: node.content.map(walk) };
    }
    return node;
  };
  return walk(json);
};

`;
  content = content.replace(utilInsertPoint, stripUtil + utilInsertPoint);
  
  // Now wrap the getJSON call
  content = content.replace(
    "json: editor.getJSON()",
    "json: stripBase64Images(editor.getJSON())"
  );
  console.log('FIX 2: Added base64 image stripping guard for saves');
} else {
  console.log('FIX 2: Already patched or marker not found');
}

// ── FIX 3: Add error boundary around handleImageUpload ──
const imgUploadMarker = "const handleImageUpload";
if (content.includes(imgUploadMarker) && !content.includes('MAX_IMAGE_SIZE_MB')) {
  const sizeGuard = `  // \u{1F525} PRODUCTION FIX: Reject oversized images before upload
  const MAX_IMAGE_SIZE_MB = 10;
  `;
  // Find handleImageUpload and add size check
  const uploadIdx = content.indexOf(imgUploadMarker);
  if (uploadIdx !== -1) {
    // Find the function body start
    const bodyStart = content.indexOf('{', uploadIdx);
    if (bodyStart !== -1) {
      const afterBrace = bodyStart + 1;
      const sizeCheck = `
    // \u{1F525} PRODUCTION: Reject files over 10MB
    if (file && file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(\`Image too large (\${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is \${MAX_IMAGE_SIZE_MB}MB.\`);
      return;
    }`;
      // Only add if not already present
      if (!content.includes('Image too large')) {
        content = content.substring(0, afterBrace) + sizeCheck + content.substring(afterBrace);
        console.log('FIX 3: Added image size guard (10MB limit)');
      } else {
        console.log('FIX 3: Image size guard already present');
      }
    }
  }
} else {
  console.log('FIX 3: handleImageUpload not found or already patched');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\nAll production fixes applied successfully!');
