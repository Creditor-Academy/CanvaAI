import React from 'react';
import { IndentIncrease, IndentDecrease } from 'lucide-react';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { toast } from 'sonner';

export const IndentControls = ({ editor }) => {
  const canIndent = (() => {
    if (!editor) return false;
    try {
      if (editor.isActive('listItem')) {
        return editor.can().sinkListItem('listItem');
      }
      return typeof editor.can().indent === 'function' ? editor.can().indent() : true;
    } catch {
      return true;
    }
  })();

  const canOutdent = (() => {
    if (!editor) return false;
    try {
      if (editor.isActive('listItem')) {
        return editor.can().liftListItem('listItem');
      }
      return typeof editor.can().outdent === 'function' ? editor.can().outdent() : true;
    } catch {
      return true;
    }
  })();

  const indent = () => {
    if (!editor) return;
    try {
      if (editor.isActive('listItem')) {
        const result = editor.chain().focus().sinkListItem('listItem').run();
        if (result) toast.success('List item indented');
      } else {
        const result = editor.chain().focus().indent().run();
        if (result) toast.success('Text indented');
      }
    } catch {
      toast.error('Failed to indent');
    }
  };

  const outdent = () => {
    if (!editor) return;
    try {
      if (editor.isActive('listItem')) {
        const result = editor.chain().focus().liftListItem('listItem').run();
        if (result) toast.success('List item outdented');
      } else {
        const result = editor.chain().focus().outdent().run();
        if (result) toast.success('Text outdented');
      }
    } catch {
      toast.error('Failed to outdent');
    }
  };

  return (
    <>
      <ToolbarButton
        onClick={indent}
        tooltip="Increase Indent"
        className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        disabled={!canIndent}
      >
        <IndentIncrease className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      <ToolbarButton
        onClick={outdent}
        tooltip="Decrease Indent"
        className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        disabled={!canOutdent}
      >
        <IndentDecrease className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
    </>
  );
};

export default IndentControls;
