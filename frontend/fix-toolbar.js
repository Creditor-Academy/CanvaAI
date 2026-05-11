const fs = require('fs');

const filePath = 'c:/Users/y/merged-canva-ai/CanvaAI/frontend/src/components/athena-editor/components/editor/toolbar/EditorToolbar.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Header with Menu (from {/* Header with Menu */} up to {/* Compact Single-Row Toolbar */})
const startHeader = content.indexOf('{/* Header with Menu */}');
const endHeader = content.indexOf('{/* Compact Single-Row Toolbar */}');
if (startHeader !== -1 && endHeader !== -1) {
  content = content.substring(0, startHeader) + content.substring(endHeader);
}

// 2. Fix ToolbarButton definition
const oldToolbarBtn = `        className={cn(
          "h-9 w-9 p-0 hover:bg-gray-100 rounded-full",
          isActive && "bg-blue-100 text-blue-600 hover:bg-blue-100",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}`;
const newToolbarBtn = `        className={cn(
          "h-8 w-8 p-0 rounded text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors",
          isActive && "bg-blue-100 text-blue-800",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}`;
content = content.replace(oldToolbarBtn, newToolbarBtn);

// 3. Fix the Compact Single-Row Toolbar container
content = content.replace(
  'className="flex items-center px-4 py-2 gap-1 border-t border-gray-200 bg-white overflow-x-auto"',
  'className="flex items-center px-4 py-1.5 gap-0.5 border-t border-b border-blue-100 bg-[#f8fbff] overflow-x-auto w-full"'
);

// 4. Remove all crazy classNames from ToolbarButtons
content = content.replace(/className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"/g, '');

// 5. Change all <Icon className="w-5 h-5 text-white" /> to <Icon className="w-4 h-4" />
// We can do this with a regex:
content = content.replace(/className="w-5 h-5 text-white"/g, 'className="w-4 h-4"');

// 6. Fix dropdowns (Font, FontSize, Heading)
// Font family dropdown:
content = content.replace(
  /className="text-sm bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg px-3 py-1\.5 h-9 min-w-\[120px\][^"]*"/,
  'className="text-xs bg-white rounded px-2 py-1 h-8 min-w-[100px] hover:bg-gray-50 focus:outline-none border border-gray-200 text-gray-700 mx-1"'
);
// Font size dropdown:
content = content.replace(
  /className="text-sm bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg px-3 py-1\.5 h-9 w-16[^"]*"/,
  'className="text-xs bg-white rounded px-2 py-1 h-8 w-14 hover:bg-gray-50 focus:outline-none border border-gray-200 text-gray-700 mx-1"'
);
// Heading level dropdown:
content = content.replace(
  /className="text-sm bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg px-3 py-1\.5 h-9 w-20[^"]*"/,
  'className="text-xs bg-white rounded px-2 py-1 h-8 w-24 hover:bg-gray-50 focus:outline-none border border-gray-200 text-gray-700 mx-1"'
);

// 7. Fix separators
content = content.replace(/<Separator orientation="vertical" className="mx-2 h-6" \/>/g, '<div className="w-[1px] h-4 bg-blue-200 mx-1" />');

// 8. Make AI Assist button look like the image (pink/purple gradient)
// Find the AI Assistant ToolbarButton and give it a special class
const oldAIBtn = `        <ToolbarButton
          onClick={() => setShowAIAssistant(!showAIAssistant)}
          tooltip="AI Assistant"
          
        >
          <Sparkles className="w-4 h-4" />
        </ToolbarButton>`;

const newAIBtn = `        <div className="flex-1"></div>
        <Button
          onClick={() => setShowAIAssistant(!showAIAssistant)}
          className="h-8 px-3 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-medium flex items-center gap-1.5 border-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Assist
        </Button>`;

content = content.replace(oldAIBtn, newAIBtn);
// Wait, the regex replace above removed the className from ToolbarButton, leaving it empty. So oldAIBtn matches.

// Save
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacing styles!');
