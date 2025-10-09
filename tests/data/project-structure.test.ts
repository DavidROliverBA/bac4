import { TFolder, Vault } from 'obsidian';
import {
  getProjectStructure,
  getProjectFiles,
  createProjectStructure,
  isValidProject,
  findAllProjects,
} from '../../src/data/project-structure';

// Mock Obsidian's Vault and TFolder
jest.mock('obsidian', () => ({
  TFolder: jest.fn(),
  Vault: jest.fn(),
}));

describe('Project Structure', () => {
  describe('getProjectStructure', () => {
    it('should return correct folder structure', () => {
      const structure = getProjectStructure('test-project', 'projects');

      expect(structure.root).toBe('projects/test-project');
      expect(structure.diagrams).toBe('projects/test-project/diagrams');
      expect(structure.components).toBe('projects/test-project/components');
      expect(structure.prompts).toBe('projects/test-project/prompts');
      expect(structure.reports).toBe('projects/test-project/reports');
    });

    it('should handle nested base locations', () => {
      const structure = getProjectStructure('my-project', 'work/architecture');

      expect(structure.root).toBe('work/architecture/my-project');
      expect(structure.diagrams).toBe('work/architecture/my-project/diagrams');
    });
  });

  describe('getProjectFiles', () => {
    it('should return correct file paths', () => {
      const files = getProjectFiles('test-project', 'projects');

      expect(files.metadata).toBe('projects/test-project/project.json');
      expect(files.readme).toBe('projects/test-project/README.md');
    });
  });

  describe('createProjectStructure', () => {
    let mockVault: jest.Mocked<Vault>;

    beforeEach(() => {
      mockVault = {
        createFolder: jest.fn().mockResolvedValue(undefined),
      } as any;
    });

    it('should create all required folders', async () => {
      await createProjectStructure(mockVault, 'test-project', 'projects');

      expect(mockVault.createFolder).toHaveBeenCalledTimes(5);
      expect(mockVault.createFolder).toHaveBeenCalledWith('projects/test-project');
      expect(mockVault.createFolder).toHaveBeenCalledWith('projects/test-project/diagrams');
      expect(mockVault.createFolder).toHaveBeenCalledWith('projects/test-project/components');
      expect(mockVault.createFolder).toHaveBeenCalledWith('projects/test-project/prompts');
      expect(mockVault.createFolder).toHaveBeenCalledWith('projects/test-project/reports');
    });

    it('should return the created structure', async () => {
      const structure = await createProjectStructure(mockVault, 'my-project', 'work');

      expect(structure.root).toBe('work/my-project');
      expect(structure.diagrams).toBe('work/my-project/diagrams');
      expect(structure.components).toBe('work/my-project/components');
      expect(structure.prompts).toBe('work/my-project/prompts');
      expect(structure.reports).toBe('work/my-project/reports');
    });
  });

  describe('isValidProject', () => {
    let mockVault: jest.Mocked<Vault>;

    beforeEach(() => {
      mockVault = {
        getAbstractFileByPath: jest.fn(),
      } as any;
    });

    it('should return true for valid project', async () => {
      const mockFolder = Object.create(TFolder.prototype);
      mockFolder.path = 'projects/test-project';

      const mockDiagrams = Object.create(TFolder.prototype);
      const mockComponents = Object.create(TFolder.prototype);
      const mockPrompts = Object.create(TFolder.prototype);
      const mockReports = Object.create(TFolder.prototype);

      const mockSubfolders = {
        'projects/test-project': mockFolder,
        'projects/test-project/diagrams': mockDiagrams,
        'projects/test-project/components': mockComponents,
        'projects/test-project/prompts': mockPrompts,
        'projects/test-project/reports': mockReports,
        'projects/test-project/project.json': {},
      };

      mockVault.getAbstractFileByPath.mockImplementation((path: string): any => {
        const result = mockSubfolders[path as keyof typeof mockSubfolders];
        return result || null;
      });

      const isValid = await isValidProject(mockVault, 'projects/test-project');

      expect(isValid).toBe(true);
    });

    it('should return false if root folder does not exist', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const isValid = await isValidProject(mockVault, 'projects/nonexistent');

      expect(isValid).toBe(false);
    });

    it('should return false if required subfolder is missing', async () => {
      const mockFolder = { path: 'projects/test-project' } as TFolder;
      const mockSubfolders = {
        'projects/test-project': mockFolder,
        'projects/test-project/diagrams': {} as TFolder,
        // Missing 'components' folder
        'projects/test-project/prompts': {} as TFolder,
        'projects/test-project/reports': {} as TFolder,
        'projects/test-project/project.json': {},
      };

      mockVault.getAbstractFileByPath.mockImplementation((path: string): any => {
        return mockSubfolders[path as keyof typeof mockSubfolders] || null;
      });

      const isValid = await isValidProject(mockVault, 'projects/test-project');

      expect(isValid).toBe(false);
    });

    it('should return false if project.json is missing', async () => {
      const mockFolder = { path: 'projects/test-project' } as TFolder;
      const mockSubfolders = {
        'projects/test-project': mockFolder,
        'projects/test-project/diagrams': {} as TFolder,
        'projects/test-project/components': {} as TFolder,
        'projects/test-project/prompts': {} as TFolder,
        'projects/test-project/reports': {} as TFolder,
        // Missing 'project.json'
      };

      mockVault.getAbstractFileByPath.mockImplementation((path: string): any => {
        return mockSubfolders[path as keyof typeof mockSubfolders] || null;
      });

      const isValid = await isValidProject(mockVault, 'projects/test-project');

      expect(isValid).toBe(false);
    });
  });

  describe('findAllProjects', () => {
    let mockVault: jest.Mocked<Vault>;

    beforeEach(() => {
      mockVault = {
        getAbstractFileByPath: jest.fn(),
      } as any;
    });

    it('should find all valid projects', async () => {
      const mockProject1 = Object.create(TFolder.prototype);
      mockProject1.path = 'projects/project1';

      const mockProject2 = Object.create(TFolder.prototype);
      mockProject2.path = 'projects/project2';

      const mockBaseFolder: any = {
        path: 'projects',
        children: [mockProject1, mockProject2],
      };
      Object.setPrototypeOf(mockBaseFolder, TFolder.prototype);

      mockVault.getAbstractFileByPath.mockImplementation((path: string) => {
        if (path === 'projects') return mockBaseFolder;

        // Mock project1 as valid (has all folders + project.json)
        if (path === 'projects/project1') return mockProject1;
        if (path.startsWith('projects/project1/')) {
          return Object.create(path.endsWith('.json') ? Object.prototype : TFolder.prototype);
        }

        // Mock project2 as invalid (missing project.json)
        if (path === 'projects/project2') return mockProject2;
        if (path === 'projects/project2/project.json') {
          return null;
        }
        if (path.startsWith('projects/project2/')) {
          return Object.create(TFolder.prototype);
        }

        return null;
      });

      const projects = await findAllProjects(mockVault, 'projects');

      expect(projects).toContain('projects/project1');
      expect(projects).not.toContain('projects/project2');
    });

    it('should return empty array if base location does not exist', async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const projects = await findAllProjects(mockVault, 'nonexistent');

      expect(projects).toEqual([]);
    });
  });
});
