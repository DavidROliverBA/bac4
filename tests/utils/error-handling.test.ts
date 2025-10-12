/**
 * Tests for Error Handling Utility
 */

// Mock Obsidian Notice before importing ErrorHandler
const mockNotice = jest.fn();
jest.mock('obsidian', () => ({
  Notice: mockNotice,
}));

import { ErrorHandler, DiagramError } from '../../src/utils/error-handling';

// Mock console.error to avoid noise in test output
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('DiagramError', () => {
  it('should create error with message, code, and context', () => {
    const error = new DiagramError(
      'Test error message',
      'TEST_ERROR',
      { foo: 'bar', count: 42 }
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.context).toEqual({ foo: 'bar', count: 42 });
    expect(error.name).toBe('DiagramError');
  });

  it('should create error without context', () => {
    const error = new DiagramError('Test error', 'TEST_ERROR');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.context).toBeUndefined();
  });

  it('should be instance of Error', () => {
    const error = new DiagramError('Test', 'TEST');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DiagramError);
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should log standard Error to console', () => {
      const error = new Error('Standard error');

      ErrorHandler.handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('BAC4 Error:', error);
    });

    it('should log DiagramError with code and context', () => {
      const error = new DiagramError(
        'Diagram error',
        'DIAGRAM_ERROR',
        { path: '/test/path' }
      );

      ErrorHandler.handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('BAC4 Error:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error code:', 'DIAGRAM_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error context:', { path: '/test/path' });
    });

    it('should show Notice when userMessage provided', () => {
      const error = new Error('Test error');

      ErrorHandler.handleError(error, 'User-friendly error message');

      expect(mockNotice).toHaveBeenCalledWith('User-friendly error message', 5000);
    });

    it('should not show Notice when userMessage not provided', () => {
      const error = new Error('Test error');

      ErrorHandler.handleError(error);

      expect(mockNotice).not.toHaveBeenCalled();
    });

    it('should use custom duration for Notice', () => {
      const error = new Error('Test error');

      ErrorHandler.handleError(error, 'Custom duration message', 3000);

      expect(mockNotice).toHaveBeenCalledWith('Custom duration message', 3000);
    });

    it('should handle unknown error types', () => {
      const error = 'string error';

      ErrorHandler.handleError(error, 'Unknown error occurred');

      expect(consoleErrorSpy).toHaveBeenCalledWith('BAC4 Error:', error);
      expect(mockNotice).toHaveBeenCalledWith('Unknown error occurred', 5000);
    });
  });

  describe('handleAsync', () => {
    it('should return resolved value on success', async () => {
      const promise = Promise.resolve({ data: 'test' });

      const result = await ErrorHandler.handleAsync(promise, 'Error message');

      expect(result).toEqual({ data: 'test' });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(mockNotice).not.toHaveBeenCalled();
    });

    it('should handle rejection and return null', async () => {
      const error = new Error('Async error');
      const promise = Promise.reject(error);

      const result = await ErrorHandler.handleAsync(promise, 'Operation failed');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('BAC4 Error:', error);
      expect(mockNotice).toHaveBeenCalledWith('Operation failed', 5000);
    });

    it('should handle rejection with DiagramError', async () => {
      const error = new DiagramError('Diagram operation failed', 'ASYNC_ERROR');
      const promise = Promise.reject(error);

      const result = await ErrorHandler.handleAsync(promise, 'Failed to load diagram');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('BAC4 Error:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error code:', 'ASYNC_ERROR');
      expect(mockNotice).toHaveBeenCalledWith('Failed to load diagram', 5000);
    });
  });

  describe('showSuccess', () => {
    it('should show Notice with success message and default duration', () => {
      ErrorHandler.showSuccess('Operation completed successfully');

      expect(mockNotice).toHaveBeenCalledWith('Operation completed successfully', 3000);
    });

    it('should show Notice with custom duration', () => {
      ErrorHandler.showSuccess('Quick success', 1000);

      expect(mockNotice).toHaveBeenCalledWith('Quick success', 1000);
    });
  });

  describe('showInfo', () => {
    it('should show Notice with info message and default duration', () => {
      ErrorHandler.showInfo('Please save the diagram first');

      expect(mockNotice).toHaveBeenCalledWith('Please save the diagram first', 4000);
    });

    it('should show Notice with custom duration', () => {
      ErrorHandler.showInfo('Important info', 6000);

      expect(mockNotice).toHaveBeenCalledWith('Important info', 6000);
    });
  });
});
