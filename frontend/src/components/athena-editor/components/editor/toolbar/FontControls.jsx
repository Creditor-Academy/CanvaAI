import React from 'react';
import { ChevronDown, Type, Highlighter, Plus, Minus } from 'lucide-react';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { Button } from '../../ui/button';

import { Separator } from '../../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { cn } from '../../utils';
import { FONTS, FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS } from '../../../constants';

export const FontControls = ({ 
  editor, 
  currentFont, 
  setFontFamily,
  currentFontSize,
  setFontSize,
  currentTextColor,
  setTextColor,
  currentHighlight,
  setHighlightColor,
  activeHeadingLevel,
  handleHeadingChange
}) => {
  if (!editor) return null;

  const increaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(currentFontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      setFontSize(FONT_SIZES[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(currentFontSize);
    if (currentIndex > 0) {
      setFontSize(FONT_SIZES[currentIndex - 1]);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Font Family */}
      <Select
        value={currentFont}
        onValueChange={(value) => setFontFamily(value)}
      >
        <SelectTrigger className="w-32.5 h-8 text-xs bg-white border-blue-200 hover:border-blue-400 focus:ring-blue-400">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((font) => (
            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Size */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton onClick={decreaseFontSize} tooltip="Decrease Font Size" className="h-8 w-6 px-0">
          <Minus className="w-3 h-3" />
        </ToolbarButton>
        <Select
          value={currentFontSize.toString()}
          onValueChange={(value) => setFontSize(parseInt(value))}
        >
          <SelectTrigger className="w-12.5 h-8 text-xs bg-white border-blue-200 hover:border-blue-400 focus:ring-blue-400 px-2">
            <SelectValue placeholder="11" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolbarButton onClick={increaseFontSize} tooltip="Increase Font Size" className="h-8 w-6 px-0">
          <Plus className="w-3 h-3" />
        </ToolbarButton>
      </div>

      {/* Heading Level */}
      <Select
        value={(activeHeadingLevel || 0).toString()}
        onValueChange={(value) => handleHeadingChange(parseInt(value))}
      >
        <SelectTrigger className="w-20 h-8 text-xs bg-white border-blue-200 hover:border-blue-400 focus:ring-blue-400">
          <SelectValue placeholder="Normal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Normal</SelectItem>
          <SelectItem value="1">H1</SelectItem>
          <SelectItem value="2">H2</SelectItem>
          <SelectItem value="3">H3</SelectItem>
          <SelectItem value="4">H4</SelectItem>
          <SelectItem value="5">H5</SelectItem>
          <SelectItem value="6">H6</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-2 h-5" />

      {/* Text Color Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 transition-all duration-300">
            <div className="flex flex-col items-center justify-center">
              <span className="font-bold text-sm leading-none" style={{ color: currentTextColor }}>A</span>
              <div className="w-4 h-1 mt-0.5 rounded-full" style={{ backgroundColor: currentTextColor }}></div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 p-3 rounded-xl shadow-lg border border-gray-200 bg-white">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium mb-2">Text Color</h4>
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.slice(0, 12).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-110 transition-transform shadow-sm",
                      currentTextColor === color && "ring-2 ring-blue-500"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor && setTextColor(color);
                      editor.chain().focus().setColor(color).run();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Highlight Color Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 transition-all duration-300">
            <Highlighter className="w-4 h-4 text-blue-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 p-3 rounded-xl shadow-lg border border-gray-200 bg-white">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium mb-2">Highlight Color</h4>
              <div className="grid grid-cols-6 gap-1">
                {HIGHLIGHT_COLORS.slice(0, 12).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-110 transition-transform shadow-sm",
                      currentHighlight === color && "ring-2 ring-blue-500"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setHighlightColor && setHighlightColor(color);
                      editor.chain().focus().toggleHighlight({ color }).run();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Separator orientation="vertical" className="mx-2 h-5" />
    </div>
  );
};
