/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { attachThemedSelect } from '../themed-select';

function makeSelect(values: string[]): HTMLSelectElement {
  const select = document.createElement('select');
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  document.body.appendChild(select);
  return select;
}

function getMenu(): HTMLElement | null {
  return document.body.querySelector('.themed-select-menu');
}

function requireMenu(): HTMLElement {
  const menu = getMenu();
  if (!menu) throw new Error('themed-select menu is not open');
  return menu;
}

function options(): HTMLElement[] {
  return Array.from(
    requireMenu().querySelectorAll<HTMLElement>('.themed-select-option')
  );
}

function mousedown(el: Element): void {
  el.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, cancelable: true })
  );
}

function click(el: Element): void {
  el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );
}

describe('attachThemedSelect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // jsdom does not implement scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets aria attributes on attach', () => {
    const select = makeSelect(['GET', 'POST']);
    attachThemedSelect(select);
    expect(select.getAttribute('aria-haspopup')).toBe('listbox');
    expect(select.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens a themed menu with all options on mousedown', () => {
    const select = makeSelect(['GET', 'POST', 'PUT']);
    attachThemedSelect(select);

    mousedown(select);

    const menu = getMenu();
    expect(menu).not.toBeNull();
    expect(options().length).toBe(3);
    expect(select.getAttribute('aria-expanded')).toBe('true');
  });

  it('marks the currently selected option', () => {
    const select = makeSelect(['GET', 'POST', 'PUT']);
    select.value = 'POST';
    attachThemedSelect(select);

    mousedown(select);
    expect(options()[1].classList.contains('is-selected')).toBe(true);
  });

  it('selecting an option updates value and fires change once', () => {
    const select = makeSelect(['GET', 'POST', 'PUT']);
    attachThemedSelect(select);
    const onChange = vi.fn();
    select.addEventListener('change', onChange);

    mousedown(select);
    click(options()[2]);

    expect(select.value).toBe('PUT');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getMenu()).toBeNull();
  });

  it('toggles closed on a second mousedown', () => {
    const select = makeSelect(['GET', 'POST']);
    attachThemedSelect(select);

    mousedown(select);
    expect(getMenu()).not.toBeNull();
    mousedown(select);
    expect(getMenu()).toBeNull();
  });

  it('closes on Escape', () => {
    const select = makeSelect(['GET', 'POST']);
    attachThemedSelect(select);

    mousedown(select);
    expect(getMenu()).not.toBeNull();
    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    expect(getMenu()).toBeNull();
  });

  it('does not open when the select is disabled', () => {
    const select = makeSelect(['GET', 'POST']);
    select.disabled = true;
    attachThemedSelect(select);

    mousedown(select);
    expect(getMenu()).toBeNull();
  });

  it('does not select a disabled option', () => {
    const select = makeSelect(['GET', 'POST']);
    select.options[1].disabled = true;
    attachThemedSelect(select);

    mousedown(select);
    click(options()[1]);

    expect(select.value).toBe('GET');
  });

  it('reads the live option list each time it opens', () => {
    const select = makeSelect(['GET']);
    attachThemedSelect(select);

    // Add an option after attach (mirrors the environment dropdown being
    // repopulated after environments load).
    const opt = document.createElement('option');
    opt.value = 'POST';
    opt.textContent = 'POST';
    select.appendChild(opt);

    mousedown(select);
    expect(options().length).toBe(2);
  });

  it('destroy() removes the menu, listeners and aria attributes', () => {
    const select = makeSelect(['GET', 'POST']);
    const controller = attachThemedSelect(select);

    mousedown(select);
    expect(getMenu()).not.toBeNull();

    controller.destroy();
    expect(getMenu()).toBeNull();
    expect(select.hasAttribute('aria-haspopup')).toBe(false);

    // After destroy the trigger no longer opens a menu.
    mousedown(select);
    expect(getMenu()).toBeNull();
  });

  it('ignores a repeated attach on the same element', () => {
    const select = makeSelect(['GET', 'POST']);
    attachThemedSelect(select);
    attachThemedSelect(select);

    mousedown(select);
    // Exactly one menu is rendered, not two.
    expect(document.body.querySelectorAll('.themed-select-menu').length).toBe(
      1
    );
  });

  it('stays open when scrolling inside the menu', async () => {
    const select = makeSelect(['GET', 'POST', 'PUT']);
    attachThemedSelect(select);

    mousedown(select);
    const menu = requireMenu();
    // Let the deferred scroll/resize/outside listeners register.
    await new Promise((resolve) => setTimeout(resolve, 0));

    menu.dispatchEvent(new Event('scroll'));
    expect(getMenu()).not.toBeNull();
  });

  it('closes when the page scrolls outside the menu', async () => {
    const select = makeSelect(['GET', 'POST', 'PUT']);
    attachThemedSelect(select);

    mousedown(select);
    requireMenu();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.dispatchEvent(new Event('scroll'));
    expect(getMenu()).toBeNull();
  });
});
