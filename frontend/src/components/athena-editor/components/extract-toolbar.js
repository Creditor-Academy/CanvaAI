import fs from 'fs';

const textEditorPath = 'c:/Users/y/merged-canva-ai/CanvaAI/frontend/src/components/athena-editor/components/TextEditor.jsx';
const editorToolbarPath = 'c:/Users/y/merged-canva-ai/CanvaAI/frontend/src/components/athena-editor/components/editor/toolbar/EditorToolbar.jsx';

let content = fs.readFileSync(textEditorPath, 'utf8');

// Get indices
const importsEnd = content.indexOf('// ✅ BUG 1 FIX');
if(importsEnd === -1) throw new Error('Could not find importsEnd');
const imports = content.substring(0, importsEnd);

const safetyStart = content.indexOf('// New feature components');
const safetyEnd = content.indexOf('// Constants');
if(safetyStart === -1 || safetyEnd === -1) throw new Error('Could not find safety block');
const safetyBlock = content.substring(safetyStart, safetyEnd);

let startIdx = content.indexOf('// Constants\r\nconst FONTS = [');
if(startIdx === -1) startIdx = content.indexOf('// Constants\nconst FONTS = [');

let endMarkerStr = '\r\n// ─── Add heading styles helper';
let endIdx = content.indexOf(endMarkerStr);
if(endIdx === -1) endIdx = content.indexOf('\n// ─── Add heading styles helper');

if (startIdx !== -1 && endIdx !== -1) {
    const extractedBlock = content.substring(startIdx, endIdx);
    
    let newToolbarContent = imports + '\n' + safetyBlock + '\n' + extractedBlock + '\n';
    
    // Fix imports paths for EditorToolbar.jsx (which is 2 levels deeper)
    newToolbarContent = newToolbarContent.replace(/from '\.\/ui\//g, "from '../../ui/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/extensions\//g, "from '../../../extensions/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/\.\.\/\.\.\/styles\//g, "from '../../../../../styles/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/components\/editor\//g, "from '../../");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/utils\//g, "from '../../../utils/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/hooks\//g, "from '../../../hooks/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/\.\.\/\.\.\/services\//g, "from '../../../../../services/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/\.\.\/\.\.\/utils\//g, "from '../../../../../utils/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/\.\.\/\.\.\/hooks\//g, "from '../../../../../hooks/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/contexts\//g, "from '../../../contexts/");
    newToolbarContent = newToolbarContent.replace(/from '\.\.\/ai\//g, "from '../../../ai/");
    newToolbarContent = newToolbarContent.replace(/from '\.\/editor\//g, "from '../../");
    newToolbarContent = newToolbarContent.replace(/from '\.\/ExportDialog/g, "from '../../ExportDialog");
    newToolbarContent = newToolbarContent.replace(/from '\.\/utils/g, "from '../../utils");
    
    // Write new component
    fs.writeFileSync(editorToolbarPath, newToolbarContent, 'utf8');
    
    // Removing the extracted block from TextEditor.jsx
    let replaced = content.substring(0, startIdx) + content.substring(endIdx);
    
    // Add import to TextEditor.jsx
    const importStatement = `import { EditorToolbar } from './editor/toolbar/EditorToolbar.jsx';\n`;
    
    const contextIdx = replaced.indexOf("import { EditorProvider, useEditorContext }");
    let finalContent = replaced;
    if (contextIdx !== -1) {
        finalContent = replaced.substring(0, contextIdx) + importStatement + replaced.substring(contextIdx);
    } else {
        const fallbackIdx = replaced.indexOf('import { useEditor, EditorContent }');
        finalContent = replaced.substring(0, fallbackIdx) + importStatement + replaced.substring(fallbackIdx);
    }
    
    fs.writeFileSync(textEditorPath, finalContent, 'utf8');
    console.log('Successfully extracted EditorToolbar');
} else {
    console.log('Failed to find boundaries in TextEditor.jsx');
}
