/**
 * Navigation History Service
 *
 * Manages back/forward navigation history for diagrams.
 * Enables browser-like navigation with back/forward buttons and keyboard shortcuts.
 *
 * @version 2.3.0
 */

import type BAC4Plugin from '../main';

export interface NavigationEntry {
  filePath: string;
  timestamp: number;
  diagramType?: string;
  scrollPosition?: { x: number; y: number };
  zoom?: number;
}

export class NavigationHistoryService {
  private history: NavigationEntry[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  private plugin: BAC4Plugin;

  constructor(plugin: BAC4Plugin) {
    this.plugin = plugin;
  }

  /**
   * Add a new navigation entry
   */
  addEntry(entry: Omit<NavigationEntry, 'timestamp'>): void {
    // Remove any forward history when navigating to a new location
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new entry
    const fullEntry: NavigationEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    this.history.push(fullEntry);
    this.currentIndex = this.history.length - 1;

    // Trim history if it exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    console.log('Navigation: Added entry', {
      filePath: entry.filePath,
      currentIndex: this.currentIndex,
      historyLength: this.history.length,
    });
  }

  /**
   * Navigate back in history
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  async goBack(): Promise<NavigationEntry | null> {
    if (!this.canGoBack()) {
      console.log('Navigation: Cannot go back');
      return null;
    }

    this.currentIndex--;
    const entry = this.history[this.currentIndex];
    console.log('Navigation: Going back to', entry.filePath);
    return entry;
  }

  /**
   * Navigate forward in history
   */
  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  async goForward(): Promise<NavigationEntry | null> {
    if (!this.canGoForward()) {
      console.log('Navigation: Cannot go forward');
      return null;
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    console.log('Navigation: Going forward to', entry.filePath);
    return entry;
  }

  /**
   * Get current navigation entry
   */
  getCurrentEntry(): NavigationEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Get breadcrumb trail (all entries leading to current)
   */
  getBreadcrumbs(): NavigationEntry[] {
    if (this.currentIndex < 0) return [];
    return this.history.slice(0, this.currentIndex + 1);
  }

  /**
   * Get full history
   */
  getHistory(): NavigationEntry[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    console.log('Navigation: History cleared');
  }

  /**
   * Get history state for persistence
   */
  getState(): { history: NavigationEntry[]; currentIndex: number } {
    return {
      history: [...this.history],
      currentIndex: this.currentIndex,
    };
  }

  /**
   * Restore history state
   */
  setState(state: { history: NavigationEntry[]; currentIndex: number }): void {
    this.history = [...state.history];
    this.currentIndex = state.currentIndex;
    console.log('Navigation: State restored', {
      historyLength: this.history.length,
      currentIndex: this.currentIndex,
    });
  }
}
