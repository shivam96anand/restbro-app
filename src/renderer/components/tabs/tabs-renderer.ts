import { RequestTab } from '../../../shared/types';

export class TabsRenderer {
  renderTabs(tabs: RequestTab[], activeTabId: string | undefined): void {
    const tabList = document.getElementById('request-tab-list');
    if (!tabList) return;

    tabList.innerHTML = '';

    const newTabButton = document.createElement('button');
    newTabButton.className = 'request-tab new-tab-button';
    newTabButton.dataset.tabId = 'new';
    newTabButton.textContent = '+ New Request';
    newTabButton.title = 'Create new request';
    tabList.appendChild(newTabButton);

    tabs.forEach((tab) => {
      const tabElement = document.createElement('button');
      tabElement.className = `request-tab ${tab.id === activeTabId ? 'active' : ''}`;
      tabElement.dataset.tabId = tab.id;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = tab.name + (tab.isModified ? ' •' : '');
      nameSpan.className = 'tab-name';

      const closeButton = document.createElement('span');
      closeButton.className = 'tab-close';
      closeButton.dataset.tabId = tab.id;
      closeButton.textContent = '×';
      closeButton.title = 'Close tab';

      tabElement.appendChild(nameSpan);
      tabElement.appendChild(closeButton);
      tabList.appendChild(tabElement);
    });
  }
}
