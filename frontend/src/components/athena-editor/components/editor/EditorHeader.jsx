import React from 'react';
import HeaderMenuBar from './HeaderMenuBar';

export const EditorHeader = ({
  editor,
  onSave,
  onPrint,
  onPaste,
  onPastePlainText,
  onToggleSpellCheck,
  onToggleBulletList,
  onToggleOrderedList,
  onToggleTaskList,
  onIndent,
  onOutdent,
  onInsertPageBreak,
  onInsertHorizontalRule,
  onToggleBlockquote
}) => {
  return (
    <header className="flex flex-col border-b border-gray-200 bg-white z-50">
      <div className="flex items-center justify-between px-1 h-12">
        <HeaderMenuBar
          editor={editor}
          onSave={onSave}
          onPrint={onPrint}
          onPaste={onPaste}
          onPastePlainText={onPastePlainText}
          onToggleSpellCheck={onToggleSpellCheck}
          onToggleBulletList={onToggleBulletList}
          onToggleOrderedList={onToggleOrderedList}
          onToggleTaskList={onToggleTaskList}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onInsertPageBreak={onInsertPageBreak}
          onInsertHorizontalRule={onInsertHorizontalRule}
          onToggleBlockquote={onToggleBlockquote}
        />
      </div>
    </header>
  );
};
