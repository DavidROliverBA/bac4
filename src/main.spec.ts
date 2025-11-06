import BAC4Plugin from './main';
import type { App, PluginManifest } from 'obsidian';

describe('BAC4Plugin', () => {
  it('should be defined', () => {
    expect(BAC4Plugin).toBeDefined();
  });

  it('should have onload method', () => {
    const plugin = new BAC4Plugin(
      {} as Partial<App> as App,
      {} as Partial<PluginManifest> as PluginManifest
    );
    expect(plugin.onload).toBeDefined();
    expect(typeof plugin.onload).toBe('function');
  });

  it('should have onunload method', () => {
    const plugin = new BAC4Plugin(
      {} as Partial<App> as App,
      {} as Partial<PluginManifest> as PluginManifest
    );
    expect(plugin.onunload).toBeDefined();
    expect(typeof plugin.onunload).toBe('function');
  });
});
