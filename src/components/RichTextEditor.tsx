import React, { useCallback, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  RemoveFormatting,
  Undo2,
  Redo2,
} from 'lucide-react';
import { richTextToPlain, sanitizeRichText } from '../utils/richText';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeightClass?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Lightweight WYSIWYG editor. Formatting is stored as HTML and rendered with
 * the same `.rich-content` styles on the public product page, so the authoring
 * view and the live listing stay visually identical.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something…',
  maxLength = 2000,
  minHeightClass = 'min-h-[120px]',
  ariaLabel = 'Rich text editor',
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRange = useRef<Range | null>(null);
  const isFocused = useRef(false);

  // Sync external value (draft restore, reset, profile edit) without moving
  // the caret while the user is typing.
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isFocused.current) return;
    const next = sanitizeRichText(value);
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = (el.textContent || '').replace(/\u200b/g, '').trim();
    onChange(text ? el.innerHTML : '');
  }, [onChange]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedRange.current;
    const sel = window.getSelection();
    if (!range || !sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  const exec = useCallback(
    (command: string, argument?: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();
      try {
        document.execCommand('styleWithCSS', false, 'false');
      } catch {
        /* older browsers */
      }
      document.execCommand(command, false, argument);
      saveSelection();
      emitChange();
    },
    [emitChange, restoreSelection, saveSelection]
  );

  const handleLink = () => {
    const url = window.prompt('Enter a link URL', 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      exec('unlink');
      return;
    }
    const href = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    exec('createLink', href);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    // Paste as plain text so foreign colors/fonts never break the live theme.
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    restoreSelection();
    document.execCommand('insertText', false, text);
    emitChange();
  };

  const handleBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (!maxLength) return;
    const el = editorRef.current;
    if (!el) return;
    const inputEvent = event.nativeEvent as InputEvent;
    if (!inputEvent.inputType || !inputEvent.inputType.startsWith('insert')) return;
    if ((el.textContent || '').length >= maxLength) event.preventDefault();
  };

  const ToolButton: React.FC<{
    label: string;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ label, onClick, children }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault();
        saveSelection();
      }}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 hover:shadow-2xs cursor-pointer"
    >
      {children}
    </button>
  );

  const used = richTextToPlain(value).length;

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white shadow-2xs transition-colors focus-within:border-mint-500 focus-within:ring-1 focus-within:ring-mint-500 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-1.5 py-1">
        <ToolButton label="Bold" onClick={() => exec('bold')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Italic" onClick={() => exec('italic')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Underline" onClick={() => exec('underline')}>
          <Underline className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Strikethrough" onClick={() => exec('strikeThrough')}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolButton>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <ToolButton label="Heading" onClick={() => exec('formatBlock', '<h2>')}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Subheading" onClick={() => exec('formatBlock', '<h3>')}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Paragraph" onClick={() => exec('formatBlock', '<p>')}>
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolButton>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <ToolButton label="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <List className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Numbered list" onClick={() => exec('insertOrderedList')}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Quote" onClick={() => exec('formatBlock', '<blockquote>')}>
          <Quote className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Code block" onClick={() => exec('formatBlock', '<pre>')}>
          <Code2 className="h-3.5 w-3.5" />
        </ToolButton>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <ToolButton label="Insert link" onClick={handleLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Clear formatting" onClick={() => exec('removeFormat')}>
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Undo" onClick={() => exec('undo')}>
          <Undo2 className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton label="Redo" onClick={() => exec('redo')}>
          <Redo2 className="h-3.5 w-3.5" />
        </ToolButton>

        {maxLength > 0 && (
          <span className="ml-auto pr-1 font-mono-num text-[10px] font-semibold text-neutral-400">
            {used}/{maxLength}
          </span>
        )}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        onInput={emitChange}
        onFocus={() => {
          isFocused.current = true;
        }}
        onBlur={() => {
          isFocused.current = false;
          emitChange();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={handlePaste}
        onBeforeInput={handleBeforeInput}
        className={`rich-editor rich-content ${minHeightClass} w-full px-3 py-2.5 text-xs leading-relaxed text-neutral-900 outline-none`}
      />
    </div>
  );
};

export default RichTextEditor;
