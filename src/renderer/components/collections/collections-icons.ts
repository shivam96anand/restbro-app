/**
 * SVG Icon System for Collections Viewer
 * VS Code style outlined icons with consistent 16x16px sizing
 */

export type IconType =
  | 'folder-closed'
  | 'folder-open'
  | 'file'
  | 'http-get'
  | 'http-post'
  | 'http-put'
  | 'http-patch'
  | 'http-delete'
  | 'http-head'
  | 'http-options'
  | 'add-folder'
  | 'add-file'
  | 'add'
  | 'import'
  | 'chevron-right'
  | 'chevron-down';

const icons: Record<IconType, string> = {
  'folder-closed': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6L7.5 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
  `,
  'folder-open': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6L7.5 4H13C13.8284 4 14.5 4.67157 14.5 5.5V7H2.5V3.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M2 7L1.5 12.5C1.5 13.3284 2.17157 14 3 14H13C13.8284 14 14.5 13.3284 14.5 12.5L14 7H2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
  `,
  file: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 1.5H9.5L12.5 4.5V14.5H3.5V1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M9.5 1.5V4.5H12.5" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
  `,
  'http-get': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2L12 6H9V12H7V6H4L8 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M3 14H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,
  'http-post': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,
  'http-put': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8L8 2L14 8M8 3V14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  'http-patch': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 2L13.5 5L6.5 12L3 13L4 9.5L10.5 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M9 3.5L12 6.5" stroke="currentColor" stroke-width="1.2"/>
    </svg>
  `,
  'http-delete': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 5V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V5M2 5H14M6 5V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.5 8V11M9.5 8V11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,
  'http-head': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2"/>
      <path d="M5 8C5 6.5 6 5.5 8 5.5C10 5.5 11 6.5 11 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="6.5" cy="7" r="0.8" fill="currentColor"/>
      <circle cx="9.5" cy="7" r="0.8" fill="currentColor"/>
    </svg>
  `,
  'http-options': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3V7M8 9V13M8 7L11.5 5M8 9L11.5 11M8 7L4.5 5M8 9L4.5 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  'add-folder': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H5.5L6.5 3.5H10.5M10.5 3.5H13C13.8284 3.5 14.5 4.17157 14.5 5V10.5M10.5 3.5V13.5M10.5 13.5H8M10.5 13.5H13" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M10.5 10.5V13.5M9 12H12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,
  'add-file': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 1.5H8L10.5 4V8M10.5 8V14.5H3.5V1.5M10.5 8H14M10.5 8V4M10.5 4H8" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M10.5 11H13.5M12 9.5V12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,
  add: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  import: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 12V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,
  'chevron-right': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  'chevron-down': `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
};

/**
 * Get SVG icon markup as a string
 */
export function getIcon(type: IconType): string {
  return icons[type] || icons['file'];
}

/**
 * Create an SVG icon element with optional classes and styles
 */
export function createIconElement(
  type: IconType,
  options?: {
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
    title?: string;
  }
): HTMLElement {
  const container = document.createElement('span');
  container.className = options?.className || 'icon';
  container.innerHTML = getIcon(type);

  if (options?.style) {
    Object.assign(container.style, options.style);
  }

  if (options?.title) {
    container.title = options.title;
  }

  // Ensure the SVG fills the container
  const svg = container.querySelector('svg');
  if (svg) {
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
  }

  return container;
}

/**
 * Get the appropriate icon for an HTTP method
 */
export function getMethodIcon(method: string): IconType {
  const methodLower = method.toLowerCase();
  switch (methodLower) {
    case 'get':
      return 'http-get';
    case 'post':
      return 'http-post';
    case 'put':
      return 'http-put';
    case 'patch':
      return 'http-patch';
    case 'delete':
      return 'http-delete';
    case 'head':
      return 'http-head';
    case 'options':
      return 'http-options';
    default:
      return 'file';
  }
}
