/**
 * Makes the Key/Value column boundary of a `.kv-table` draggable.
 *
 * The split is written to a shared `--kv-key-width` custom property on the
 * closest `.request-form` (falling back to the table itself) so the PARAMS and
 * HEADERS tables — plus the column header and every data row — stay in sync.
 * Double-clicking the handle restores the CSS default.
 */

const CHECK_COL = 40; // px — width of the enable-checkbox column
const ACTIONS_COL = 40; // px — width of the remove-button column
const MIN_KEY = 90; // px — smallest allowed Key column
const MIN_VALUE = 120; // px — smallest allowed Value column

export function setupKvColumnResize(table: HTMLElement): void {
  if ((table as HTMLElement & { __kvResizeSetup?: boolean }).__kvResizeSetup) {
    return;
  }

  const handle = table.querySelector<HTMLElement>('.kv-col-resizer');
  const grid = table.querySelector<HTMLElement>('.kv-header');
  if (!handle || !grid) return;

  (table as HTMLElement & { __kvResizeSetup?: boolean }).__kvResizeSetup = true;

  // Shared scope so both request tables move together.
  const scope: HTMLElement =
    (table.closest('.request-form') as HTMLElement | null) ?? table;

  let dragging = false;

  const applyFromClientX = (clientX: number): void => {
    const rect = grid.getBoundingClientRect();
    if (rect.width <= 0) return;

    const maxKey = rect.width - CHECK_COL - ACTIONS_COL - MIN_VALUE;
    if (maxKey <= MIN_KEY) return;

    let keyPx = clientX - rect.left - CHECK_COL;
    keyPx = Math.max(MIN_KEY, Math.min(keyPx, maxKey));

    const percent = (keyPx / rect.width) * 100;
    scope.style.setProperty('--kv-key-width', `${percent.toFixed(3)}%`);
  };

  handle.addEventListener('pointerdown', (e: PointerEvent) => {
    e.preventDefault();
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    document.body.classList.add('kv-col-resizing');
  });

  handle.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    applyFromClientX(e.clientX);
  });

  const endDrag = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    if (handle.hasPointerCapture(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }
    document.body.classList.remove('kv-col-resizing');
  };

  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);

  // Double-click resets to the CSS default split.
  handle.addEventListener('dblclick', () => {
    scope.style.removeProperty('--kv-key-width');
  });
}
