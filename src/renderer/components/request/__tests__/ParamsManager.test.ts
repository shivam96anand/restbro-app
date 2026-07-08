/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParamsManager } from '../editors/ParamsManager';

function buildContainer(): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="kv-table">
      <div class="key-value-editor" id="params-editor"></div>
    </div>
    <button class="add-param-btn">Add Parameter</button>
  `;
  document.body.appendChild(container);
  return container;
}

describe('ParamsManager row removal keeps consumers in sync', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('dispatches params-editor-mutated when a row is removed via the × button', () => {
    const container = buildContainer();
    const manager = new ParamsManager(container);
    manager.loadParams([{ key: 'aet', value: '1234', enabled: true }]);

    const editor = container.querySelector('#params-editor') as HTMLElement;
    const mutated = vi.fn();
    editor.addEventListener('params-editor-mutated', mutated);

    const removeBtn = editor.querySelector('.remove-btn') as HTMLButtonElement;
    removeBtn.click();

    // The URL-preview sync relies on this event because a remove-button click
    // does not emit a native input/change event.
    expect(mutated).toHaveBeenCalledTimes(1);
  });

  it('reports empty params exactly once after the only row is removed', () => {
    const container = buildContainer();
    const manager = new ParamsManager(container);
    manager.loadParams([{ key: 'aet', value: '1234', enabled: true }]);

    const onUpdate = vi.fn();
    manager.onUpdate(onUpdate);

    const editor = container.querySelector('#params-editor') as HTMLElement;
    const removeBtn = editor.querySelector('.remove-btn') as HTMLButtonElement;
    removeBtn.click();

    // No double-fire: the model update runs once; the mutation event is a
    // separate channel ParamsManager itself does not listen to.
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith([]);
  });
});
