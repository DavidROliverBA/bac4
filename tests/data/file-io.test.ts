import { Vault } from 'obsidian';
import {
  readJSON,
  writeJSON,
  readYAML,
  writeYAML,
  fileExists,
  deleteFile,
  FileNotFoundError,
  ParseError,
  FileIOError,
} from '../../src/data/file-io';

// Mock the yaml library
jest.mock('yaml', () => ({
  parse: jest.fn((str: string) => {
    if (str.includes('invalid')) {
      throw new Error('Invalid YAML');
    }
    return { parsed: true, content: str };
  }),
  stringify: jest.fn((obj: any) => `yaml: ${JSON.stringify(obj)}`),
}));

describe('File I/O', () => {
  let mockVault: jest.Mocked<Vault>;

  beforeEach(() => {
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as any;
  });

  describe('readJSON', () => {
    it('should read and parse valid JSON file', async () => {
      const mockFile = { path: 'test.json' };
      const mockContent = '{"name":"test","value":42}';

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);
      mockVault.read.mockResolvedValue(mockContent);

      const result = await readJSON<{ name: string; value: number }>(mockVault, 'test.json');

      expect(result).toEqual({ name: 'test', value: 42 });
      expect(mockVault.read).toHaveBeenCalledWith(mockFile);
    });

    it('should throw FileNotFoundError if file does not exist', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(readJSON(mockVault, 'nonexistent.json')).rejects.toThrow(FileNotFoundError);
    });

    it('should throw ParseError for invalid JSON', async () => {
      const mockFile = { path: 'invalid.json' };
      const mockContent = '{invalid json}';

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);
      mockVault.read.mockResolvedValue(mockContent);

      await expect(readJSON(mockVault, 'invalid.json')).rejects.toThrow(ParseError);
    });
  });

  describe('writeJSON', () => {
    it('should write JSON with pretty-print formatting to new file', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const data = { name: 'test', value: 42, nested: { key: 'value' } };

      await writeJSON(mockVault, 'new.json', data);

      expect(mockVault.create).toHaveBeenCalledWith(
        'new.json',
        JSON.stringify(data, null, 2)
      );
      expect(mockVault.modify).not.toHaveBeenCalled();
    });

    it('should modify existing file', async () => {
      const mockFile = { path: 'existing.json' };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);

      const data = { updated: true };

      await writeJSON(mockVault, 'existing.json', data);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        JSON.stringify(data, null, 2)
      );
      expect(mockVault.create).not.toHaveBeenCalled();
    });

    it('should throw FileIOError on write failure', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockRejectedValue(new Error('Write failed'));

      await expect(writeJSON(mockVault, 'fail.json', {})).rejects.toThrow(FileIOError);
    });
  });

  describe('readYAML', () => {
    it('should read and parse valid YAML file', async () => {
      const mockFile = { path: 'test.yaml' };
      const mockContent = 'name: test\nvalue: 42';

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);
      mockVault.read.mockResolvedValue(mockContent);

      const result = await readYAML(mockVault, 'test.yaml');

      expect(result).toEqual({ parsed: true, content: mockContent });
      expect(mockVault.read).toHaveBeenCalledWith(mockFile);
    });

    it('should throw FileNotFoundError if file does not exist', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(readYAML(mockVault, 'nonexistent.yaml')).rejects.toThrow(FileNotFoundError);
    });

    it('should throw ParseError for invalid YAML', async () => {
      const mockFile = { path: 'invalid.yaml' };
      const mockContent = 'invalid yaml content';

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);
      mockVault.read.mockResolvedValue(mockContent);

      await expect(readYAML(mockVault, 'invalid.yaml')).rejects.toThrow(ParseError);
    });
  });

  describe('writeYAML', () => {
    it('should write YAML to new file', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const data = { name: 'test', value: 42 };

      await writeYAML(mockVault, 'new.yaml', data);

      expect(mockVault.create).toHaveBeenCalledWith(
        'new.yaml',
        `yaml: ${JSON.stringify(data)}`
      );
      expect(mockVault.modify).not.toHaveBeenCalled();
    });

    it('should modify existing file', async () => {
      const mockFile = { path: 'existing.yaml' };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);

      const data = { updated: true };

      await writeYAML(mockVault, 'existing.yaml', data);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        `yaml: ${JSON.stringify(data)}`
      );
      expect(mockVault.create).not.toHaveBeenCalled();
    });

    it('should throw FileIOError on write failure', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockRejectedValue(new Error('Write failed'));

      await expect(writeYAML(mockVault, 'fail.yaml', {})).rejects.toThrow(FileIOError);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', () => {
      mockVault.getAbstractFileByPath.mockReturnValue({ path: 'exists.txt' } as any);

      const exists = fileExists(mockVault, 'exists.txt');

      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const exists = fileExists(mockVault, 'nonexistent.txt');

      expect(exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file and return true', async () => {
      const mockFile = { path: 'delete-me.txt' };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);

      const deleted = await deleteFile(mockVault, 'delete-me.txt');

      expect(deleted).toBe(true);
      expect(mockVault.delete).toHaveBeenCalledWith(mockFile);
    });

    it('should return false if file does not exist', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const deleted = await deleteFile(mockVault, 'nonexistent.txt');

      expect(deleted).toBe(false);
      expect(mockVault.delete).not.toHaveBeenCalled();
    });

    it('should throw FileIOError on delete failure', async () => {
      const mockFile = { path: 'fail.txt' };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile as any);
      mockVault.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteFile(mockVault, 'fail.txt')).rejects.toThrow(FileIOError);
    });
  });
});
