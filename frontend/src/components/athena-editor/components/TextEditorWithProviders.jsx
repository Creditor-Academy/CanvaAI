/**
 * TextEditorWithProviders
 * Root wrapper that composes context providers around TextEditorContent.
 *
 * Usage:
 *   <TextEditorWithProviders
 *     initialContent={null}
 *     activeDocId={null}
 *     mongoId={null}
 *     onMongoIdSaved={null}
 *     onDeleteDocument={null}
 *   />
 */

import React from 'react';
import { EditorProvider } from '../contexts/EditorContent.jsx';
import { ImageProvider } from '../contexts/ImageContext.jsx';
import TextEditorContent from './TextEditorContent.jsx';

const TextEditorWithProviders = ({
  initialContent = null,
  activeDocId = null,
  mongoId = null,
  onMongoIdSaved = null,
  onDeleteDocument = null,
}) => (
  <EditorProvider>
    <ImageProvider>
      <TextEditorContent
        initialContent={initialContent}
        activeDocId={activeDocId}
        mongoId={mongoId}
        onMongoIdSaved={onMongoIdSaved}
        onDeleteDocument={onDeleteDocument}
      />
    </ImageProvider>
  </EditorProvider>
);

export default TextEditorWithProviders;
