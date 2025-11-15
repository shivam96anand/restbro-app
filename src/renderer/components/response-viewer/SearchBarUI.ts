/**
 * SearchBar UI components builder
 */

export class SearchBarUI {
  private elements: Map<string, HTMLElement> = new Map();

  public getElement(key: string): HTMLElement | undefined {
    return this.elements.get(key);
  }

  public createModeSelector(
    onSwitch: (mode: 'search' | 'jsonpath') => void
  ): HTMLElement {
    const selector = document.createElement('div');
    selector.className = 'search-mode-selector';

    const searchMode = document.createElement('button');
    searchMode.className = 'mode-button active';
    searchMode.textContent = 'Search';
    searchMode.dataset.mode = 'search';

    const jsonPathMode = document.createElement('button');
    jsonPathMode.className = 'mode-button';
    jsonPathMode.textContent = 'JSONPath';
    jsonPathMode.dataset.mode = 'jsonpath';

    searchMode.addEventListener('click', () => onSwitch('search'));
    jsonPathMode.addEventListener('click', () => onSwitch('jsonpath'));

    selector.appendChild(searchMode);
    selector.appendChild(jsonPathMode);

    this.elements.set('mode-search', searchMode);
    this.elements.set('mode-jsonpath', jsonPathMode);

    return selector;
  }

  public createInputContainer(placeholder: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'search-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = placeholder;

    const icon = document.createElement('span');
    icon.className = 'search-icon';
    icon.textContent = '🔍';

    container.appendChild(icon);
    container.appendChild(input);

    this.elements.set('input', input);
    return container;
  }

  public createNavigationControls(
    onPrev: () => void,
    onNext: () => void
  ): HTMLElement {
    const navigation = document.createElement('div');
    navigation.className = 'search-navigation';

    const results = document.createElement('span');
    results.className = 'search-results';
    results.textContent = '0/0';

    const prevButton = document.createElement('button');
    prevButton.className = 'nav-button';
    prevButton.textContent = '↑';
    prevButton.title = 'Previous (Shift+F3)';
    prevButton.disabled = true;

    const nextButton = document.createElement('button');
    nextButton.className = 'nav-button';
    nextButton.textContent = '↓';
    nextButton.title = 'Next (F3)';
    nextButton.disabled = true;

    prevButton.addEventListener('click', onPrev);
    nextButton.addEventListener('click', onNext);

    navigation.appendChild(results);
    navigation.appendChild(prevButton);
    navigation.appendChild(nextButton);

    this.elements.set('results', results);
    this.elements.set('prev', prevButton);
    this.elements.set('next', nextButton);

    return navigation;
  }

  public createCloseButton(onClose: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = 'search-close';
    button.textContent = '×';
    button.title = 'Close (Escape)';

    button.addEventListener('click', onClose);

    this.elements.set('close', button);
    return button;
  }

  public updateResults(current: number, total: number): void {
    const results = this.elements.get('results');
    const prevButton = this.elements.get('prev') as HTMLButtonElement;
    const nextButton = this.elements.get('next') as HTMLButtonElement;

    if (results) {
      results.textContent = `${current}/${total}`;
    }

    if (prevButton) {
      prevButton.disabled = total === 0;
    }

    if (nextButton) {
      nextButton.disabled = total === 0;
    }
  }

  public getInput(): HTMLInputElement | null {
    return this.elements.get('input') as HTMLInputElement | null;
  }

  public updateModeButtons(mode: 'search' | 'jsonpath'): void {
    const searchButton = this.elements.get('mode-search');
    const jsonPathButton = this.elements.get('mode-jsonpath');

    if (searchButton && jsonPathButton) {
      searchButton.classList.toggle('active', mode === 'search');
      jsonPathButton.classList.toggle('active', mode === 'jsonpath');
    }
  }
}
