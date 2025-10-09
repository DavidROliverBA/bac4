/**
 * Mock implementation of Obsidian API for testing
 */

export class Plugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  addRibbonIcon(icon: string, title: string, callback: () => void): any {
    return { icon, title, callback };
  }

  addCommand(_command: any): void {
    // Mock implementation
  }

  addSettingTab(_tab: any): void {
    // Mock implementation
  }

  async loadData(): Promise<any> {
    return {};
  }

  async saveData(_data: any): Promise<void> {
    // Mock implementation
  }
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any;

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      empty: jest.fn(),
      createEl: jest.fn(),
    };
  }

  display(): void {
    // Mock implementation
  }
}

export class Setting {
  constructor(_containerEl: any) {
    // Mock implementation
  }

  setName(_name: string): this {
    return this;
  }

  setDesc(_desc: string): this {
    return this;
  }

  addText(callback: (text: any) => void): this {
    const text = {
      setPlaceholder: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
    };
    callback(text);
    return this;
  }

  addToggle(callback: (toggle: any) => void): this {
    const toggle = {
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
    };
    callback(toggle);
    return this;
  }
}

export class Vault {
  getAbstractFileByPath(_path: string): any {
    return null;
  }

  async read(_file: any): Promise<string> {
    return '';
  }

  async modify(_file: any, _content: string): Promise<void> {
    // Mock implementation
  }

  async create(path: string, _content: string): Promise<any> {
    return { path };
  }

  async delete(_file: any): Promise<void> {
    // Mock implementation
  }

  async createFolder(path: string): Promise<any> {
    return { path };
  }
}

export class TFolder {
  path: string;
  children: any[];

  constructor(path: string) {
    this.path = path;
    this.children = [];
  }
}

export class TFile {
  path: string;
  basename: string;
  extension: string;

  constructor(path: string) {
    this.path = path;
    this.basename = path.split('/').pop()?.split('.')[0] || '';
    this.extension = path.split('.').pop() || '';
  }
}

export class App {
  vault: Vault;

  constructor() {
    this.vault = new Vault();
  }
}
