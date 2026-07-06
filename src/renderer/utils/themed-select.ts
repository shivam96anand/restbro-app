/**
 * Themed dropdown for native `<select>` elements.
 *
 * macOS renders the native `<select>` option popup with the OS appearance,
 * ignoring the app theme (dark surface / primary accent). This helper
 * suppresses the native popup and renders a themed menu — styled with the
 * app's CSS variables so it always matches the currently selected theme —
 * while keeping the underlying `<select>` as the source of truth.
 *
 * Existing code that reads `select.value`, listens for `change`, or
 * repopulates `<option>`s keeps working unchanged: the menu reads the live
 * option list every time it opens and dispatches native `input` + `change`
 * events on selection.
 */

export interface ThemedSelectController {
  /** Detach listeners and remove any open menu. */
  destroy(): void;
}

const ATTACHED = new WeakSet<HTMLSelectElement>();
const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;

/**
 * Turn a native `<select>` into a themed dropdown. Safe to call once per
 * element — repeated calls on the same element are ignored.
 */
export function attachThemedSelect(
  select: HTMLSelectElement
): ThemedSelectController {
  if (ATTACHED.has(select)) {
    return { destroy: () => undefined };
  }
  ATTACHED.add(select);

  let menu: HTMLDivElement | null = null;
  let optionEls: HTMLOptionElement[] = [];
  let highlightedIndex = -1;

  select.setAttribute('aria-haspopup', 'listbox');
  select.setAttribute('aria-expanded', 'false');

  const isOpen = (): boolean => menu !== null;

  function open(): void {
    if (isOpen() || select.disabled) return;
    optionEls = Array.from(select.options);
    if (optionEls.length === 0) return;

    const m = document.createElement('div');
    m.className = 'themed-select-menu';
    m.setAttribute('role', 'listbox');
    // Inherit the trigger's font so mono verbs (GET/POST) stay mono while
    // regular selects (environments) use the default UI font.
    m.style.fontFamily = getComputedStyle(select).fontFamily;

    optionEls.forEach((opt, i) => {
      const item = document.createElement('div');
      item.className = 'themed-select-option';
      item.setAttribute('role', 'option');
      item.dataset.index = String(i);
      const label = document.createElement('span');
      label.className = 'themed-select-option__label';
      label.textContent = opt.textContent || opt.value;
      item.appendChild(label);

      if (opt.disabled) item.classList.add('is-disabled');
      if (i === select.selectedIndex) {
        item.classList.add('is-selected');
        item.setAttribute('aria-selected', 'true');
      }

      item.addEventListener('mousemove', () => setHighlight(i));
      // Keep focus on the trigger on press (preventDefault), then commit the
      // choice on click so we never leave a dangling mouseup/click for the
      // element sitting beneath the menu.
      item.addEventListener('mousedown', (e) => e.preventDefault());
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!opt.disabled) choose(i);
      });
      m.appendChild(item);
    });

    document.body.appendChild(m);
    menu = m;
    position();

    const initial =
      select.selectedIndex >= 0
        ? select.selectedIndex
        : optionEls.findIndex((o) => !o.disabled);
    setHighlight(initial);
    scrollHighlightedIntoView();

    select.setAttribute('aria-expanded', 'true');
    // Defer so the click/keypress that opened the menu doesn't immediately
    // trigger the outside handler and close it.
    setTimeout(() => {
      document.addEventListener('mousedown', onOutside, true);
      window.addEventListener('scroll', onReflowClose, true);
      window.addEventListener('resize', onReflowClose, true);
    }, 0);
  }

  function close(): void {
    if (!menu) return;
    menu.remove();
    menu = null;
    optionEls = [];
    highlightedIndex = -1;
    select.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', onOutside, true);
    window.removeEventListener('scroll', onReflowClose, true);
    window.removeEventListener('resize', onReflowClose, true);
  }

  function toggle(): void {
    if (isOpen()) close();
    else open();
  }

  function choose(index: number): void {
    const opt = optionEls[index];
    if (!opt || opt.disabled) return;
    if (select.selectedIndex !== index) {
      select.selectedIndex = index;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close();
    select.focus();
  }

  function setHighlight(index: number): void {
    if (!menu) return;
    highlightedIndex = index;
    const items = menu.querySelectorAll<HTMLElement>('.themed-select-option');
    items.forEach((el, i) =>
      el.classList.toggle('is-highlighted', i === index)
    );
  }

  function moveHighlight(delta: number): void {
    if (!menu) return;
    const count = optionEls.length;
    if (count === 0) return;
    let i = highlightedIndex;
    for (let step = 0; step < count; step++) {
      i = (i + delta + count) % count;
      if (!optionEls[i].disabled) break;
    }
    setHighlight(i);
    scrollHighlightedIntoView();
  }

  function scrollHighlightedIntoView(): void {
    if (!menu || highlightedIndex < 0) return;
    const el = menu.querySelector<HTMLElement>(
      `.themed-select-option[data-index="${highlightedIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }

  function position(): void {
    if (!menu) return;
    const rect = select.getBoundingClientRect();
    menu.style.minWidth = `${rect.width}px`;

    const menuRect = menu.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp =
      spaceBelow < menuRect.height + MENU_GAP && rect.top > spaceBelow;

    const maxLeft = window.innerWidth - menuRect.width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft));
    menu.style.left = `${left}px`;
    menu.style.top = openUp
      ? `${Math.max(VIEWPORT_MARGIN, rect.top - menuRect.height - MENU_GAP)}px`
      : `${rect.bottom + MENU_GAP}px`;
  }

  const onOutside = (e: MouseEvent): void => {
    const target = e.target as Node | null;
    if (menu?.contains(target)) return;
    if (target === select || select.contains(target)) return;
    close();
  };

  // Native `<select>` popups close on scroll/resize; mirror that instead of
  // chasing the trigger, which avoids a floating menu when it scrolls away.
  // Scrolling *inside* the menu (long option lists are scrollable) must NOT
  // close it — only a page/ancestor scroll or a resize does.
  const onReflowClose = (e: Event): void => {
    if (e.type === 'scroll' && menu?.contains(e.target as Node | null)) {
      return;
    }
    close();
  };

  const onMouseDown = (e: MouseEvent): void => {
    // Block the native popup, then drive the themed menu ourselves.
    e.preventDefault();
    select.focus();
    toggle();
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (isOpen()) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveHighlight(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveHighlight(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0) choose(highlightedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          close();
          break;
        case 'Tab':
          close();
          break;
        default:
          break;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault();
        open();
        break;
      default:
        break;
    }
  };

  select.addEventListener('mousedown', onMouseDown);
  select.addEventListener('keydown', onKeyDown);

  return {
    destroy(): void {
      close();
      select.removeEventListener('mousedown', onMouseDown);
      select.removeEventListener('keydown', onKeyDown);
      select.removeAttribute('aria-haspopup');
      select.removeAttribute('aria-expanded');
      ATTACHED.delete(select);
    },
  };
}
