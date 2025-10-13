/**
 * Error Handling Utility
 *
 * Centralized error handling for the BAC4 plugin.
 * Provides consistent error logging and user notifications using Obsidian's Notice API.
 *
 * @module error-handling
 */

import { Notice } from 'obsidian';

/**
 * Custom error class for BAC4-specific errors
 *
 * @example
 * ```typescript
 * throw new DiagramError(
 *   'Failed to load diagram',
 *   'DIAGRAM_LOAD_ERROR',
 *   { filePath: 'my-diagram.bac4' }
 * );
 * ```
 */
export class DiagramError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DiagramError';
  }
}

/**
 * Centralized error handler
 *
 * Logs errors to console and optionally shows user-facing notifications.
 */
export const ErrorHandler = {
  /**
   * Handle an error with optional user notification
   *
   * @param error - The error to handle
   * @param userMessage - Optional message to show to the user (via Notice)
   * @param duration - Duration to show the notice (ms), default 5000
   *
   * @example
   * ```typescript
   * try {
   *   await loadDiagram();
   * } catch (error) {
   *   ErrorHandler.handleError(error, 'Failed to load diagram');
   * }
   * ```
   */
  handleError(
    error: Error | DiagramError | unknown,
    userMessage?: string,
    duration: number = 5000
  ): void {
    // Log to console with full details
    console.error('BAC4 Error:', error);

    if (error instanceof DiagramError) {
      console.error('Error code:', error.code);
      console.error('Error context:', error.context);
    }

    // Show user notification if message provided
    if (userMessage) {
      new Notice(userMessage, duration);
    }
  },

  /**
   * Wrap an async function with error handling
   *
   * @param promise - The promise to wrap
   * @param errorMessage - Message to show if promise fails
   * @returns The promise result or null if failed
   *
   * @example
   * ```typescript
   * const diagram = await ErrorHandler.handleAsync(
   *   loadDiagram(path),
   *   'Failed to load diagram'
   * );
   * if (!diagram) {
   *   // Handle failure case
   *   return;
   * }
   * ```
   */
  async handleAsync<T>(promise: Promise<T>, errorMessage: string): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error, errorMessage);
      return null;
    }
  },

  /**
   * Show a success notification
   *
   * @param message - Success message to display
   * @param duration - Duration to show the notice (ms), default 3000
   *
   * @example
   * ```typescript
   * ErrorHandler.showSuccess('Diagram saved successfully');
   * ```
   */
  showSuccess(message: string, duration: number = 3000): void {
    new Notice(message, duration);
  },

  /**
   * Show an info notification
   *
   * @param message - Info message to display
   * @param duration - Duration to show the notice (ms), default 4000
   *
   * @example
   * ```typescript
   * ErrorHandler.showInfo('Please save the diagram first');
   * ```
   */
  showInfo(message: string, duration: number = 4000): void {
    new Notice(message, duration);
  },
};
