import { Extension } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '../../extensions/FontSize.js';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Blockquote } from '@tiptap/extension-blockquote';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { common } from 'lowlight';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Focus } from '@tiptap/extension-focus';
import Placeholder from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Plugin, PluginKey } from 'prosemirror-state';
import DOMPurify from 'dompurify';

import { Page } from '../../extensions/Page.js';
import TableExtension from '../../extensions/TableExtension.js';
import Indent from '../../extensions/Indent.js';
import { ResizableImage } from '../../extensions/ResizableImage.jsx';
import { TextDirection } from '../../extensions/TextDirection.js';
import { createSpellCheckPlugin } from '../../extensions/SpellCheckPlugin.js';

export const buildEditorExtensions = () => {
  return [
    Extension.create({
      name: 'preserveSelection',
      addProseMirrorPlugins() {
        return [
          new Plugin({
            key: new PluginKey('preserveSelection'),
            props: {
              handleDOMEvents: {
                mousedown(view, event) {
                  const t = event.target;
                  if (
                    t && (
                      t.closest('.toolbar') ||
                      t.closest('[data-radix-popper-content-wrapper]') ||
                      t.closest('[role="menu"]') ||
                      t.closest('[role="listbox"]')
                    )
                  ) {
                    // Call preventDefault so the browser doesn't move focus away
                    // from the editor — but do NOT return true.
                    //
                    // Returning true in a ProseMirror handleDOMEvents handler tells
                    // ProseMirror "I fully handled this event". That stops ALL further
                    // processing including React's synthetic event bubbling, which means
                    // onClick handlers on toolbar buttons never fire.
                    //
                    // Calling preventDefault alone is sufficient: it prevents the
                    // browser's default focus-transfer without blocking React's events.
                    event.preventDefault();
                    return false; // let React's synthetic events continue normally
                  }
                  return false;
                },
              },
            },
          }),
        ];
      },
    }),
    Document.extend({ content: 'page+' }),
    Page,
    StarterKit.configure({
      document: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      bulletList: { HTMLAttributes: { class: 'bullet-list' } },
      orderedList: { HTMLAttributes: { class: 'ordered-list' } },
      blockquote: false,
      underline: false,
      link: false,
      codeBlock: false,
    }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    TextAlign.configure({ types: ['heading', 'paragraph', 'listItem'] }),
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
    Blockquote.configure({ HTMLAttributes: { class: 'blockquote' } }),
    CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
    Highlight.configure({ multicolor: true }),
    Typography,
    CharacterCount,
    Focus.configure({ className: 'has-focus', mode: 'all' }),
    Placeholder.configure({ placeholder: 'Start typing or press / for commands...' }),
    Image.configure({ HTMLAttributes: { class: 'rounded-lg' } }),
    ResizableImage,
    TaskList.configure({ HTMLAttributes: { class: 'task-list' } }),
    TaskItem.configure({ HTMLAttributes: { class: 'task-item' }, nested: true }),
    Table.configure({ resizable: true, HTMLAttributes: { class: 'table-border-black' } }),
    TableRow,
    TableCell,
    TableHeader,
    Subscript,
    Superscript,
    Indent,
    TextDirection,
    createSpellCheckPlugin(),
    new Plugin({
      key: new PluginKey('emergencyLoopBreaker'),
      appendTransaction(transactions, oldState, newState) {
        if (transactions.some(tr => tr.docChanged)) {
          let bulletCount = 0;
          newState.doc.descendants(node => { if (node.type.name === 'bulletList') bulletCount++; });
          let oldBulletCount = 0;
          oldState.doc.descendants(n => { if (n.type.name === 'bulletList') oldBulletCount++; });
          if (bulletCount > 1000 && bulletCount > 5 * (oldBulletCount || 1)) {
            console.error('CRITICAL: Bullet list explosion detected and blocked!');
            return null;
          }
        }
        return undefined;
      }
    }),
    Extension.create({
      name: 'enhancedPaste',
      addProseMirrorPlugins() {
        return [
          new Plugin({
            key: new PluginKey('enhancedPaste'),
            props: {
              transformPastedHTML: (html) => {
                const clean = DOMPurify.sanitize(html, {
                  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'code', 'pre', 'a', 'blockquote', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'br', 'div'],
                  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'colspan', 'rowspan', 'width', 'height']
                });
                const temp = document.createElement('div');
                temp.innerHTML = clean;
                const all = temp.querySelectorAll('*');
                all.forEach((el) => {
                  if (el.tagName === 'B') {
                    const strong = document.createElement('strong');
                    strong.innerHTML = el.innerHTML;
                    el.replaceWith(strong);
                    return;
                  }
                  if (el.tagName === 'I') {
                    const em = document.createElement('em');
                    em.innerHTML = el.innerHTML;
                    el.replaceWith(em);
                    return;
                  }
                  if (el.tagName === 'STRIKE') {
                    const s = document.createElement('s');
                    s.innerHTML = el.innerHTML;
                    el.replaceWith(s);
                    return;
                  }
                  const cs = el.style;
                  if (cs && cs.fontWeight) el.style.fontWeight = cs.fontWeight;
                  if (cs && cs.fontStyle) el.style.fontStyle = cs.fontStyle;
                  if (cs && cs.textDecoration) el.style.textDecoration = cs.textDecoration;
                  if (cs && cs.color) el.style.color = cs.color;
                  if (cs && cs.backgroundColor) el.style.backgroundColor = cs.backgroundColor;
                  if (cs && cs.fontSize) el.style.fontSize = cs.fontSize;
                  if (el.tagName === 'A') {
                    const href = el.getAttribute('href');
                    if (href && !el.getAttribute('rel')) el.setAttribute('rel', 'noopener noreferrer');
                    if (href && !el.getAttribute('target')) el.setAttribute('target', '_blank');
                  }
                });
                return temp.innerHTML;
              },
              handlePaste: null,
            },
          }),
        ];
      },
    }),
    Extension.create({
      name: 'dataAttributeHandler',
      addInputRules() { return []; },
      parseHTML() {
        return [{
          tag: '*',
          getAttrs: node => {
            if (node instanceof HTMLElement) {
              const attrs = {};
              const fontFamily = node.getAttribute('data-font-family');
              if (fontFamily) attrs.fontFamily = fontFamily;
              const fontSize = node.getAttribute('data-font-size');
              if (fontSize) attrs.fontSize = fontSize;
              const color = node.getAttribute('data-color');
              if (color) attrs.color = color;
              const bgColor = node.getAttribute('data-bg-color');
              if (bgColor) attrs.backgroundColor = bgColor;
              const fontWeight = node.getAttribute('data-font-weight');
              if (fontWeight) { if (fontWeight === 'bold' || parseInt(fontWeight) >= 600) attrs.fontWeight = 'bold'; }
              const fontStyle = node.getAttribute('data-font-style');
              if (fontStyle === 'italic') attrs.fontStyle = 'italic';
              const textDecoration = node.getAttribute('data-text-decoration');
              if (textDecoration) {
                if (textDecoration.includes('underline')) attrs.textDecoration = 'underline';
                else if (textDecoration.includes('line-through')) attrs.textDecoration = 'line-through';
              }
              return Object.keys(attrs).length > 0 ? attrs : false;
            }
            return false;
          },
        }];
      },
      renderHTML({ HTMLAttributes }) {
        const { fontFamily, fontSize, color, backgroundColor, fontWeight, fontStyle, textDecoration, ...rest } = HTMLAttributes;
        const styleObj = {};
        if (fontFamily) styleObj.fontFamily = fontFamily;
        if (fontSize) styleObj.fontSize = fontSize;
        if (color) styleObj.color = color;
        if (backgroundColor) styleObj.backgroundColor = backgroundColor;
        if (fontWeight) styleObj.fontWeight = fontWeight;
        if (fontStyle) styleObj.fontStyle = fontStyle;
        if (textDecoration) styleObj.textDecoration = textDecoration;
        const styleString = Object.entries(styleObj).map(([k, v]) => `${k}:${v} `).join(';');
        return ['span', { ...rest, style: styleString }, 0];
      },
    }),
  ];
};

export default buildEditorExtensions;