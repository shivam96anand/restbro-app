export class AppManager {
  private activeTab = 'api';

  initialize(): void {
    this.setupNavTabs();
    this.showTab(this.activeTab);
  }

  private setupNavTabs(): void {
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab;

        if (tabName) {
          this.switchToTab(tabName);
        }
      });
    });
  }

  private switchToTab(tabName: string): void {
    this.activeTab = tabName;

    // Update nav tab active state
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    const activeNavTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeNavTab) {
      activeNavTab.classList.add('active');
    }

    // Show appropriate tab content
    this.showTab(tabName);
  }

  private showTab(tabName: string): void {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Show selected tab content
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }

  getActiveTab(): string {
    return this.activeTab;
  }
}