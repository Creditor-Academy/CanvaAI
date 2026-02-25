import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Keyboard, Search } from 'lucide-react';

const SHORTCUTS = {
    'Formatting': [
        { keys: ['Ctrl', 'B'], label: 'Bold' },
        { keys: ['Ctrl', 'I'], label: 'Italic' },
        { keys: ['Ctrl', 'U'], label: 'Underline' },
        { keys: ['Ctrl', 'Shift', 'S'], label: 'Strikethrough' },
        { keys: ['Ctrl', ','], label: 'Subscript' },
        { keys: ['Ctrl', '.'], label: 'Superscript' },
        { keys: ['Ctrl', 'Space'], label: 'Clear Formatting' },
        { keys: ['Ctrl', 'Shift', 'H'], label: 'Highlight' },
        { keys: ['Ctrl', 'E'], label: 'Center Align' },
        { keys: ['Ctrl', 'L'], label: 'Left Align' },
        { keys: ['Ctrl', 'R'], label: 'Right Align' },
        { keys: ['Ctrl', 'J'], label: 'Justify' },
    ],
    'Headings': [
        { keys: ['Ctrl', 'Alt', '0'], label: 'Normal Text' },
        { keys: ['Ctrl', 'Alt', '1'], label: 'Heading 1' },
        { keys: ['Ctrl', 'Alt', '2'], label: 'Heading 2' },
        { keys: ['Ctrl', 'Alt', '3'], label: 'Heading 3' },
        { keys: ['Ctrl', 'Alt', '4'], label: 'Heading 4' },
        { keys: ['Ctrl', 'Alt', '5'], label: 'Heading 5' },
        { keys: ['Ctrl', 'Alt', '6'], label: 'Heading 6' },
    ],
    'Editing': [
        { keys: ['Ctrl', 'Z'], label: 'Undo' },
        { keys: ['Ctrl', 'Y'], label: 'Redo' },
        { keys: ['Ctrl', 'X'], label: 'Cut' },
        { keys: ['Ctrl', 'C'], label: 'Copy' },
        { keys: ['Ctrl', 'V'], label: 'Paste' },
        { keys: ['Ctrl', 'Shift', 'V'], label: 'Paste Without Formatting' },
        { keys: ['Ctrl', 'A'], label: 'Select All' },
        { keys: ['Ctrl', 'F'], label: 'Find' },
        { keys: ['Ctrl', 'H'], label: 'Replace' },
        { keys: ['Ctrl', 'G'], label: 'Go To' },
        { keys: ['Tab'], label: 'Increase Indent' },
        { keys: ['Shift', 'Tab'], label: 'Decrease Indent' },
    ],
    'Lists': [
        { keys: ['Ctrl', 'Shift', '8'], label: 'Bullet List' },
        { keys: ['Ctrl', 'Shift', '7'], label: 'Numbered List' },
        { keys: ['Ctrl', 'Shift', '9'], label: 'Task List' },
    ],
    'Insert': [
        { keys: ['Ctrl', 'K'], label: 'Insert Link' },
        { keys: ['Ctrl', 'Enter'], label: 'Page Break' },
        { keys: ['Ctrl', 'Shift', 'Enter'], label: 'Insert Table' },
        { keys: ['Ctrl', 'Shift', 'I'], label: 'Insert Image' },
        { keys: ['Alt', 'Shift', 'D'], label: 'Insert Date' },
    ],
    'Navigation': [
        { keys: ['Ctrl', 'Home'], label: 'Go to Beginning' },
        { keys: ['Ctrl', 'End'], label: 'Go to End' },
        { keys: ['Ctrl', '←'], label: 'Previous Word' },
        { keys: ['Ctrl', '→'], label: 'Next Word' },
        { keys: ['Ctrl', '↑'], label: 'Previous Paragraph' },
        { keys: ['Ctrl', '↓'], label: 'Next Paragraph' },
    ],
    'AI Features': [
        { keys: ['Ctrl', 'Shift', 'A'], label: 'AI Inline Actions' },
        { keys: ['Ctrl', 'Shift', 'G'], label: 'Generate with AI' },
        { keys: ['Ctrl', 'Shift', 'C'], label: 'Code Assistant' },
    ],
    'Documents': [
        { keys: ['Ctrl', 'N'], label: 'New Document' },
        { keys: ['Ctrl', 'O'], label: 'Open Document' },
        { keys: ['Ctrl', 'S'], label: 'Save' },
        { keys: ['Ctrl', 'P'], label: 'Print' },
        { keys: ['Ctrl', 'Shift', 'E'], label: 'Export' },
        { keys: ['F11'], label: 'Full Screen' },
        { keys: ['Ctrl', '/'], label: 'Keyboard Shortcuts' },
    ],
};

const KeyBadge = ({ children }) => (
    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[10px] font-bold bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono shadow-sm">
        {children}
    </span>
);

const KeyboardShortcutsDialog = ({ open, onOpenChange }) => {
    const [search, setSearch] = useState('');

    const filteredGroups = Object.entries(SHORTCUTS).reduce((acc, [group, shortcuts]) => {
        const filtered = search
            ? shortcuts.filter(s => s.label.toLowerCase().includes(search.toLowerCase()) || s.keys.some(k => k.toLowerCase().includes(search.toLowerCase())))
            : shortcuts;
        if (filtered.length > 0) acc[group] = filtered;
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white" aria-describedby="keyboard-shortcuts-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-blue-600" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription id="keyboard-shortcuts-description" className="text-sm text-gray-500">
                        Quick reference for all available keyboard shortcuts in the editor
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search shortcuts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>

                <div className="overflow-y-auto flex-1 space-y-5 pr-1">
                    {Object.entries(filteredGroups).map(([group, shortcuts]) => (
                        <div key={group}>
                            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 px-1">{group}</h3>
                            <div className="space-y-1">
                                {shortcuts.map((shortcut, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50/50 transition-colors">
                                        <span className="text-sm text-gray-700">{shortcut.label}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, j) => (
                                                <React.Fragment key={j}>
                                                    <KeyBadge>{key}</KeyBadge>
                                                    {j < shortcut.keys.length - 1 && <span className="text-[10px] text-gray-400 mx-0.5">+</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {Object.keys(filteredGroups).length === 0 && (
                        <div className="text-center text-gray-400 py-8">No shortcuts found for "{search}"</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export { KeyboardShortcutsDialog };
