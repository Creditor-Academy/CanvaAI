import React from 'react';
import { Undo, Redo } from 'lucide-react';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { Separator } from '../../ui/separator';

export const ActionControls = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="text-blue-600"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="text-blue-600"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-2 h-5" />
    </div>
  );
};
