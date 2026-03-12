import React from 'react';
import { ChevronDown, Type, Highlighter, Plus, Minus, Check } from 'lucide-react';
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
        <ToolbarButton onClick={decreaseFontSize} className="h-8 w-6 px-0">
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
        <ToolbarButton onClick={increaseFontSize} className="h-8 w-6 px-0">
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
        <DropdownMenuContent className="w-72 p-0 rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Text Color
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">Choose the perfect color for your text</p>
          </div>
          
          {/* Color Grid */}
          <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* Quick Access - Standard Colors */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Standard Colors
              </h4>
              <div className="grid grid-cols-12 gap-1.5">
                {TEXT_COLORS.slice(0, 12).map((color, index) => (
                  <button
                    key={color}
                    className={cn(
                      "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                      currentTextColor === color 
                        ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor && setTextColor(color);
                      editor.chain().focus().setColor(color).run();
                    }}
                    title={color}
                  >
                    {index < 6 && currentTextColor === color && (
                      <Check className="w-3 h-3 mx-auto text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Warm Colors */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Warm Colors
              </h4>
              <div className="grid grid-cols-12 gap-1.5">
                {TEXT_COLORS.slice(12, 24).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                      currentTextColor === color 
                        ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor && setTextColor(color);
                      editor.chain().focus().setColor(color).run();
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Cool Colors */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Cool Colors
              </h4>
              <div className="grid grid-cols-12 gap-1.5">
                {TEXT_COLORS.slice(24, 36).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                      currentTextColor === color 
                        ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor && setTextColor(color);
                      editor.chain().focus().setColor(color).run();
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Neutral & Pastel Colors */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                Neutral & Pastel
              </h4>
              <div className="grid grid-cols-12 gap-1.5">
                {TEXT_COLORS.slice(36, 48).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                      currentTextColor === color 
                        ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor && setTextColor(color);
                      editor.chain().focus().setColor(color).run();
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Additional Colors */}
            {TEXT_COLORS.length > 48 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  More Colors
                </h4>
                <div className="grid grid-cols-12 gap-1.5">
                  {TEXT_COLORS.slice(48).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                        currentTextColor === color 
                          ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setTextColor && setTextColor(color);
                        editor.chain().focus().setColor(color).run();
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Current Color Preview */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Current:</span>
                <div 
                  className="w-6 h-6 rounded-md border-2 border-white shadow-sm" 
                  style={{ backgroundColor: currentTextColor }}
                />
                <span className="text-xs font-mono text-gray-700 uppercase">{currentTextColor}</span>
              </div>
              <button
                onClick={() => {
                  setTextColor && setTextColor('#000000');
                  editor.chain().focus().setColor('#000000').run();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Reset to Black
              </button>
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
        <DropdownMenuContent className="w-72 p-0 rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 text-white">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Highlighter className="w-4 h-4" />
              Highlight Color
            </h3>
            <p className="text-xs text-yellow-100 mt-0.5">Make your text stand out</p>
          </div>
          
          {/* Color Grid */}
          <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* Bright Highlights */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                Bright & Vibrant
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {HIGHLIGHT_COLORS.slice(0, 8).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                      currentHighlight === color 
                        ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setHighlightColor && setHighlightColor(color);
                      editor.chain().focus().toggleHighlight({ color }).run();
                    }}
                    title={color}
                  >
                    {currentHighlight === color && (
                      <Check className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pastel Highlights */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-300"></span>
                Soft Pastels
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {HIGHLIGHT_COLORS.slice(8, 16).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                      currentHighlight === color 
                        ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setHighlightColor && setHighlightColor(color);
                      editor.chain().focus().toggleHighlight({ color }).run();
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Light Highlights */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                Light Shades
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {HIGHLIGHT_COLORS.slice(16, 24).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                      currentHighlight === color 
                        ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setHighlightColor && setHighlightColor(color);
                      editor.chain().focus().toggleHighlight({ color }).run();
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Subtle Highlights */}
            {HIGHLIGHT_COLORS.length > 24 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                  More Options
                </h4>
                <div className="grid grid-cols-8 gap-2">
                  {HIGHLIGHT_COLORS.slice(24).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                        currentHighlight === color 
                          ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setHighlightColor && setHighlightColor(color);
                        editor.chain().focus().toggleHighlight({ color }).run();
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Current Color Preview */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Current:</span>
                <div 
                  className="w-6 h-6 rounded-md border-2 border-white shadow-sm" 
                  style={{ backgroundColor: currentHighlight || 'transparent' }}
                />
                <span className="text-xs font-mono text-gray-700 uppercase">{currentHighlight || 'None'}</span>
              </div>
              <button
                onClick={() => {
                  setHighlightColor && setHighlightColor(null);
                  editor.chain().focus().toggleHighlight({ color: null }).run();
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Remove Highlight
              </button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Separator orientation="vertical" className="mx-2 h-5" />
    </div>
  );
};
