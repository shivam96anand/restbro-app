import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { app } from 'electron';
import { Collection, AppSettings } from '../../shared/types';

interface Database {
  collections: Collection[];
  settings: AppSettings;
}

export class StoreManager {
  private db: Low<Database>;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'api-courier-data.json');
    
    const adapter = new JSONFile<Database>(this.dbPath);
    this.db = new Low<Database>(adapter, {
      collections: [],
      settings: {
        theme: 'dark',
        fontSize: 14,
        sidebarWidth: 300,
        requestPanelWidth: 400
      }
    });
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.db.read();
    await this.db.write();
  }

  getCollections(): Collection[] {
    return this.db.data?.collections || [];
  }

  async saveCollection(collection: Collection): Promise<void> {
    if (!this.db.data) return;

    const existingIndex = this.db.data.collections.findIndex(c => c.id === collection.id);
    
    if (existingIndex >= 0) {
      this.db.data.collections[existingIndex] = collection;
    } else {
      this.db.data.collections.push(collection);
    }

    await this.db.write();
  }

  async deleteCollection(id: string): Promise<void> {
    if (!this.db.data) return;

    this.db.data.collections = this.db.data.collections.filter(c => c.id !== id);
    await this.db.write();
  }

  getSettings(): AppSettings {
    return this.db.data?.settings || {
      theme: 'dark',
      fontSize: 14,
      sidebarWidth: 300,
      requestPanelWidth: 400
    };
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    if (!this.db.data) return;

    this.db.data.settings = { ...this.db.data.settings, ...settings };
    await this.db.write();
  }

  async flush(): Promise<void> {
    await this.db.write();
  }
}
