// Ask AI Utility Functions

import { AiContext, AskAiState } from './types';
import { iconHtml } from '../../utils/icons';

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape string for use in HTML attributes
 */
export function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format timestamp to relative time string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

/**
 * Format message content with markdown-like styling
 */
export function formatMessageContent(content: string): string {
  // Escape HTML first
  let formatted = escapeHtml(content);

  // Handle code blocks
  formatted = formatted.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) => {
      return `<div class="code-block"><code>${code.trim()}</code></div>`;
    }
  );

  // Handle inline code
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  );

  // Handle bold **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Handle italic *text* (but not if already part of bold)
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Handle numbered lists (1. 2. 3.)
  formatted = formatted.replace(
    /^(\d+)\.\s+(.+)$/gm,
    '<div class="list-item"><span class="list-num">$1.</span> $2</div>'
  );

  // Handle line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

/**
 * Format key-value pairs for display
 */
export function formatKeyValuePairs(data: unknown): string {
  if (!data) return '';
  if (Array.isArray(data)) {
    return data
      .filter((p: { enabled?: boolean }) => p.enabled !== false)
      .map((p: { key: string; value: string }) => `${p.key}: ${p.value}`)
      .join('\n');
  }
  return Object.entries(data as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

/**
 * Calculate context size in characters
 */
export function calculateContextSize(context: AiContext): number {
  let size = 0;
  if (context.request) size += JSON.stringify(context.request).length;
  if (context.response) {
    size +=
      (context.response.body?.length || 0) +
      JSON.stringify(context.response.headers).length +
      200;
  }
  if (context.fileContent) size += context.fileContent.length;
  return size;
}

/**
 * Show size warning alert
 */
export function showSizeWarning(size: number, maxChars: number): void {
  const sizeKb = Math.round(size / 1000);
  const maxKb = maxChars / 1000;
  alert(
    `Content too large (${sizeKb}K chars). Maximum allowed: ${maxKb}K chars.\n\nThe response or file is too big for AI analysis. Try with a smaller dataset.`
  );
}
