import React from 'react';
import { sanitizeRichText } from '../utils/richText';

interface RichTextProps {
  html?: string | null;
  className?: string;
  /** Optional fallback rendered when the field is empty. */
  fallback?: React.ReactNode;
}

/**
 * Renders sanitized rich-text HTML with the shared `.rich-content` styles.
 * Used on public listing pages so published content matches the editor preview.
 */
export const RichText: React.FC<RichTextProps> = ({ html, className = '', fallback = null }) => {
  const clean = sanitizeRichText(html);
  if (!clean) return <>{fallback}</>;

  return (
    <div
      className={`rich-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};

export default RichText;
