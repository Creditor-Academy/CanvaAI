import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from 'sonner';
import { Layout, Columns, Palette, Ruler } from 'lucide-react';

const PAGE_SIZES = [
    { label: 'A4', value: 'a4', width: 794, height: 1123 },
    { label: 'Letter', value: 'letter', width: 816, height: 1056 },
    { label: 'Legal', value: 'legal', width: 816, height: 1344 },
    { label: 'A3', value: 'a3', width: 1123, height: 1587 },
    { label: 'A5', value: 'a5', width: 559, height: 794 },
    { label: 'Custom', value: 'custom', width: 0, height: 0 },
];

const PAGE_COLORS = [
    '#ffffff', '#fef3c7', '#eff6ff', '#f0fdf4', '#fdf4ff', '#fff1f2',
    '#f1f5f9', '#fafaf9', '#0f172a', '#1e1b4b', '#064e3b', '#7f1d1d',
];

const PageSetupDialog = ({ open, onOpenChange, onApply }) => {
    const [activeTab, setActiveTab] = useState('size');
    const [pageSize, setPageSize] = useState('a4');
    const [orientation, setOrientation] = useState('portrait');
    const [customWidth, setCustomWidth] = useState(794);
    const [customHeight, setCustomHeight] = useState(1123);
    const [margins, setMargins] = useState({ top: 96, bottom: 96, left: 72, right: 72 }); // Google Docs standard: 1" top/bottom, 0.75" sides
    const [columns, setColumns] = useState(1);
    const [columnGap, setColumnGap] = useState(36);
    const [pageColor, setPageColor] = useState('#ffffff');
    const [pagelessMode, setPagelessMode] = useState(false);

    const selectedSize = PAGE_SIZES.find(s => s.value === pageSize);

    const apply = () => {
        const cfg = {
            pageSize,
            orientation,
            width: pageSize === 'custom' ? customWidth : (orientation === 'landscape' ? selectedSize.height : selectedSize.width),
            height: pageSize === 'custom' ? customHeight : (orientation === 'landscape' ? selectedSize.width : selectedSize.height),
            margins,
            columns,
            columnGap,
            pageColor,
            pagelessMode,
        };
        if (onApply) onApply(cfg);
        
        // CRITICAL FIX: Update CSS VARIABLES instead of inline styles
        // This ensures all components use the same source of truth from athena-variables.css
        const root = document.documentElement;
        root.style.setProperty('--doc-margin-top', `${margins.top}px`);
        root.style.setProperty('--doc-margin-bottom', `${margins.bottom}px`);
        root.style.setProperty('--doc-margin-left', `${margins.left}px`);
        root.style.setProperty('--doc-margin-right', `${margins.right}px`);
        root.style.setProperty('--page-bg-color', pageColor);
        
        // REMOVED: Direct inline style application that was overriding CSS
        // const editorEl = document.querySelector('.tiptap.ProseMirror');
        // if (editorEl) {
        //   editorEl.style.padding = `${margins.top}px ${margins.right}px ...`; // THIS WAS THE BUG
        //   editorEl.style.backgroundColor = pageColor;
        // }
        
        toast.success('Page setup applied - margins and colors updated');
        onOpenChange(false);
    };

    const marginPresets = [
        { label: 'Normal', values: { top: 96, bottom: 96, left: 72, right: 72 } }, // Google Docs standard
        { label: 'Narrow', values: { top: 36, bottom: 36, left: 36, right: 36 } },
        { label: 'Wide', values: { top: 96, bottom: 96, left: 108, right: 108 } },
        { label: 'Mirrored', values: { top: 96, bottom: 96, left: 90, right: 54 } },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-blue-600" /> Page Setup
                    </DialogTitle>
                    <DialogDescription>Configure page layout, margins, and appearance.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="size" className="text-xs">Size & Orientation</TabsTrigger>
                        <TabsTrigger value="margins" className="text-xs">Margins</TabsTrigger>
                        <TabsTrigger value="columns" className="text-xs">Columns</TabsTrigger>
                        <TabsTrigger value="appearance" className="text-xs">Appearance</TabsTrigger>
                    </TabsList>

                    {/* Size & Orientation */}
                    <TabsContent value="size" className="space-y-4">
                        <div>
                            <Label className="text-xs text-gray-600 mb-2 block">Page Size</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {PAGE_SIZES.map(size => (
                                    <button
                                        key={size.value}
                                        onClick={() => setPageSize(size.value)}
                                        className={`border rounded-lg p-2 text-xs font-medium transition-all ${pageSize === size.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-300 text-gray-600'}`}
                                    >
                                        <div className="flex items-center justify-center mb-1">
                                            <div
                                                className="border border-current rounded-sm"
                                                style={{
                                                    width: size.value === 'custom' ? 18 : Math.round(size.width / 60),
                                                    height: size.value === 'custom' ? 22 : Math.round(size.height / 60),
                                                    minWidth: 14, minHeight: 14
                                                }}
                                            />
                                        </div>
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {pageSize === 'custom' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-gray-600">Width (px)</Label>
                                    <Input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="h-8 text-sm mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-600">Height (px)</Label>
                                    <Input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="h-8 text-sm mt-1" />
                                </div>
                            </div>
                        )}

                        <div>
                            <Label className="text-xs text-gray-600 mb-2 block">Orientation</Label>
                            <div className="flex gap-3">
                                {['portrait', 'landscape'].map(o => (
                                    <button
                                        key={o}
                                        onClick={() => setOrientation(o)}
                                        className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-all ${orientation === o
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-300 text-gray-600'}`}
                                    >
                                        <div className={`border-2 border-current rounded-sm ${o === 'portrait' ? 'w-8 h-11' : 'w-11 h-8'}`} />
                                        <span className="text-xs font-medium capitalize">{o}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Margins */}
                    <TabsContent value="margins" className="space-y-4">
                        <div>
                            <Label className="text-xs text-gray-600 mb-2 block">Margin Presets</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {marginPresets.map(preset => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setMargins(preset.values)}
                                        className="border rounded-lg p-2 text-xs font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                                    >
                                        <span className="font-semibold">{preset.label}</span>
                                        <span className="block text-gray-400">{preset.values.top}px all sides</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {['top', 'bottom', 'left', 'right'].map(side => (
                                <div key={side}>
                                    <Label className="text-xs text-gray-600 capitalize">{side} (px)</Label>
                                    <Input
                                        type="number"
                                        value={margins[side]}
                                        onChange={e => setMargins(prev => ({ ...prev, [side]: Number(e.target.value) }))}
                                        className="h-8 text-sm mt-1"
                                        min={0} max={300}
                                    />
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Columns */}
                    <TabsContent value="columns" className="space-y-4">
                        <div>
                            <Label className="text-xs text-gray-600 mb-2 block">Number of Columns</Label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setColumns(n)}
                                        className={`flex-1 border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${columns === n
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-300 text-gray-600'}`}
                                    >
                                        <div className={`w-12 h-8 border border-current rounded flex gap-0.5 p-0.5`}>
                                            {Array.from({ length: n }).map((_, i) => (
                                                <div key={i} className="flex-1 bg-current opacity-20 rounded-sm" />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium">{n === 1 ? 'Single' : `${n} Columns`}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {columns > 1 && (
                            <div>
                                <Label className="text-xs text-gray-600">Column Gap (px)</Label>
                                <Input type="number" value={columnGap} onChange={e => setColumnGap(Number(e.target.value))} className="h-8 text-sm mt-1" min={8} max={200} />
                            </div>
                        )}
                    </TabsContent>

                    {/* Appearance */}
                    <TabsContent value="appearance" className="space-y-4">
                        <div>
                            <Label className="text-xs text-gray-600 mb-2 block">Page Color</Label>
                            <div className="grid grid-cols-6 gap-2">
                                {PAGE_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setPageColor(color)}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${pageColor === color ? 'border-blue-500 shadow-md' : 'border-gray-200'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Label className="text-xs text-gray-500">Custom:</Label>
                                <input type="color" value={pageColor} onChange={e => setPageColor(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                                <span className="text-xs text-gray-500">{pageColor}</span>
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Pageless Mode</Label>
                                    <p className="text-xs text-gray-500 mt-0.5">Remove page boundaries for a continuous document view</p>
                                </div>
                                <button
                                    onClick={() => setPagelessMode(!pagelessMode)}
                                    className={`w-11 h-6 rounded-full transition-colors ${pagelessMode ? 'bg-blue-500' : 'bg-gray-200'} relative`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${pagelessMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={apply} className="bg-blue-600 hover:bg-blue-700 text-white">Apply</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { PageSetupDialog };
