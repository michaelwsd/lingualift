import React from 'react';

/**
 * Converts inline markdown (*italic*, **bold**) in a string to React nodes.
 * Used for passage content rendering where full ReactMarkdown is not suitable
 * (e.g. when text is split into fragments for highlighting).
 */
export function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      nodes.push(<strong key={`${keyPrefix}-b-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={`${keyPrefix}-i-${match.index}`}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : [text];
}

/**
 * Applies renderInlineMarkdown to an array of React nodes,
 * processing only the string fragments (leaving existing React elements untouched).
 */
export function applyInlineMarkdown(parts: React.ReactNode[], keyPrefix: string): React.ReactNode[] {
  return parts.map((part, i) =>
    typeof part === 'string'
      ? <React.Fragment key={`${keyPrefix}-${i}`}>{renderInlineMarkdown(part, `${keyPrefix}-${i}`)}</React.Fragment>
      : part
  );
}
