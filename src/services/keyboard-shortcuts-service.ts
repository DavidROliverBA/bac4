/**
 * Keyboard Shortcuts Service
 *
 * Manages keyboard shortcuts for diagram navigation and editing.
 * Provides customizable shortcuts with conflict detection.
 *
 * @version 2.3.0
 */

import type BAC4Plugin from '../main';

export interface ShortcutDefinition {
  id: string;
  key: string;
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  description: string;
  action: () => void;
  scope?: 'canvas' | 'global';
}

export class KeyboardShortcutsService {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private plugin: BAC4Plugin;
  private isEnabled: boolean = true;

  constructor(plugin: BAC4Plugin) {
    this.plugin = plugin;
    this.registerDefaultShortcuts();
  }

  /**
   * Register default shortcuts
   */
  private registerDefaultShortcuts(): void {
    // These will be set up by the plugin when handlers are available
    console.log('Keyboard shortcuts service initialized');
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: ShortcutDefinition): void {
    const key = this.getShortcutKey(shortcut);

    if (this.shortcuts.has(key)) {
      console.warn(`Keyboard shortcut conflict: ${key} already registered`);
    }

    this.shortcuts.set(key, shortcut);
    console.log(`Registered shortcut: ${key} - ${shortcut.description}`);
  }

  /**
   * Unregister a shortcut
   */
  unregister(id: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        console.log(`Unregistered shortcut: ${id}`);
        return;
      }
    }
  }

  /**
   * Handle keyboard event
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    if (!this.isEnabled) return false;

    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      console.log(`Executed shortcut: ${key}`);
      return true;
    }

    return false;
  }

  /**
   * Get shortcut key string from definition
   */
  private getShortcutKey(shortcut: ShortcutDefinition): string {
    const parts: string[] = [];

    if (shortcut.modifiers.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers.alt) parts.push('Alt');
    if (shortcut.modifiers.shift) parts.push('Shift');
    if (shortcut.modifiers.meta) parts.push('Meta');

    parts.push(shortcut.key.toUpperCase());

    return parts.join('+');
  }

  /**
   * Get shortcut key string from keyboard event
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    parts.push(event.key.toUpperCase());

    return parts.join('+');
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Keyboard shortcuts ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if shortcuts are enabled
   */
  isShortcutsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
    console.log('All keyboard shortcuts cleared');
  }
}
