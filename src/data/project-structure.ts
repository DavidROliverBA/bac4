/**
 * Project Structure Management
 *
 * Provides utilities for creating, validating, and discovering BAC4 project
 * folder structures in an Obsidian vault. Defines the standard folder layout
 * and enforces consistency across projects.
 *
 * **Standard Project Layout:**
 * ```
 * project-name/
 * ├── diagrams/       # .bac4 diagram files
 * ├── components/     # Custom component definitions
 * ├── prompts/        # AI prompts and templates
 * ├── reports/        # Generated reports
 * ├── project.json    # Project metadata
 * └── README.md       # Project documentation
 * ```
 *
 * @module project-structure
 * @example
 * ```ts
 * // Create a new project
 * const structure = await createProjectStructure(vault, 'my-app', 'projects');
 * // Creates: projects/my-app/ with all subfolders
 *
 * // Validate existing folder
 * if (await isValidProject(vault, 'projects/my-app')) {
 *   console.log('Valid BAC4 project');
 * }
 *
 * // Find all projects
 * const projects = await findAllProjects(vault, 'projects');
 * ```
 */

import { TFolder, Vault } from 'obsidian';

/**
 * BAC4 Project folder structure definition
 *
 * Defines paths to all standard folders in a BAC4 project.
 *
 * @interface ProjectStructure
 */
export interface ProjectStructure {
  root: string;
  diagrams: string;
  components: string;
  prompts: string;
  reports: string;
}

/**
 * Required files in a BAC4 project
 *
 * Defines paths to required files that must exist for a valid BAC4 project.
 *
 * @interface ProjectFiles
 */
export interface ProjectFiles {
  metadata: string; // project.json
  readme: string; // README.md
}

/**
 * Get the folder structure paths for a BAC4 project
 *
 * Constructs the full paths for all folders in a BAC4 project based on
 * the project name and base location. Does not create any folders.
 *
 * @param projectName - Name of the project (will be used as folder name)
 * @param baseLocation - Base location in vault (e.g., 'projects', 'architecture')
 * @returns ProjectStructure object with all folder paths
 *
 * @example
 * ```ts
 * const structure = getProjectStructure('ecommerce-app', 'projects');
 * // Returns:
 * // {
 * //   root: 'projects/ecommerce-app',
 * //   diagrams: 'projects/ecommerce-app/diagrams',
 * //   components: 'projects/ecommerce-app/components',
 * //   prompts: 'projects/ecommerce-app/prompts',
 * //   reports: 'projects/ecommerce-app/reports'
 * // }
 * ```
 */
export function getProjectStructure(projectName: string, baseLocation: string): ProjectStructure {
  const root = `${baseLocation}/${projectName}`;
  return {
    root,
    diagrams: `${root}/diagrams`,
    components: `${root}/components`,
    prompts: `${root}/prompts`,
    reports: `${root}/reports`,
  };
}

/**
 * Get the required file paths for a BAC4 project
 *
 * Constructs the paths for required files (metadata and README) in a BAC4 project.
 * Does not create any files.
 *
 * @param projectName - Name of the project
 * @param baseLocation - Base location in vault
 * @returns ProjectFiles object with paths to required files
 *
 * @example
 * ```ts
 * const files = getProjectFiles('ecommerce-app', 'projects');
 * // Returns:
 * // {
 * //   metadata: 'projects/ecommerce-app/project.json',
 * //   readme: 'projects/ecommerce-app/README.md'
 * // }
 * ```
 */
export function getProjectFiles(projectName: string, baseLocation: string): ProjectFiles {
  const root = `${baseLocation}/${projectName}`;
  return {
    metadata: `${root}/project.json`,
    readme: `${root}/README.md`,
  };
}

/**
 * Create the complete folder structure for a new BAC4 project
 *
 * Creates all required folders for a new BAC4 project: root, diagrams,
 * components, prompts, and reports. If folders already exist, this will
 * throw an error from Obsidian's vault API.
 *
 * @param vault - Obsidian vault instance
 * @param projectName - Name of the new project
 * @param baseLocation - Base location in vault where project will be created
 * @returns Promise resolving to ProjectStructure with paths to created folders
 * @throws Error if folders already exist or creation fails
 *
 * @example
 * ```ts
 * try {
 *   const structure = await createProjectStructure(
 *     vault,
 *     'ecommerce-app',
 *     'projects'
 *   );
 *   console.log('Project created at:', structure.root);
 *   // Now create diagrams in structure.diagrams folder
 * } catch (error) {
 *   console.error('Failed to create project:', error);
 * }
 * ```
 */
export async function createProjectStructure(
  vault: Vault,
  projectName: string,
  baseLocation: string
): Promise<ProjectStructure> {
  const structure = getProjectStructure(projectName, baseLocation);

  // Create all folders
  await vault.createFolder(structure.root);
  await vault.createFolder(structure.diagrams);
  await vault.createFolder(structure.components);
  await vault.createFolder(structure.prompts);
  await vault.createFolder(structure.reports);

  return structure;
}

/**
 * Validate if a folder is a valid BAC4 project
 *
 * Checks if a folder contains the required structure and files to be considered
 * a valid BAC4 project. Validates:
 * - Root folder exists and is a folder
 * - Required subfolders exist (diagrams, components, prompts, reports)
 * - Required files exist (project.json)
 *
 * @param vault - Obsidian vault instance
 * @param projectPath - Path to the potential project folder
 * @returns Promise resolving to true if valid, false otherwise
 *
 * @example
 * ```ts
 * const isValid = await isValidProject(vault, 'projects/ecommerce-app');
 * if (isValid) {
 *   console.log('This is a valid BAC4 project');
 *   // Safe to use project operations
 * } else {
 *   console.log('Not a valid BAC4 project');
 *   // Prompt user to initialize or fix structure
 * }
 * ```
 */
export async function isValidProject(vault: Vault, projectPath: string): Promise<boolean> {
  try {
    // Check if root folder exists
    const rootFolder = vault.getAbstractFileByPath(projectPath);
    if (!rootFolder || !(rootFolder instanceof TFolder)) {
      return false;
    }

    // Check for required subfolders
    const requiredFolders = ['diagrams', 'components', 'prompts', 'reports'];
    for (const folder of requiredFolders) {
      const folderPath = `${projectPath}/${folder}`;
      const folderObj = vault.getAbstractFileByPath(folderPath);
      if (!folderObj || !(folderObj instanceof TFolder)) {
        return false;
      }
    }

    // Check for required files
    const metadataPath = `${projectPath}/project.json`;
    const metadataFile = vault.getAbstractFileByPath(metadataPath);
    if (!metadataFile) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating project:', error);
    return false;
  }
}

/**
 * Discover all BAC4 projects in a base location
 *
 * Scans a base folder for valid BAC4 projects by checking each subfolder
 * against the validation criteria. Returns an array of project paths.
 *
 * @param vault - Obsidian vault instance
 * @param baseLocation - Base folder to scan (e.g., 'projects', 'architecture')
 * @returns Promise resolving to array of project paths
 *
 * @example
 * ```ts
 * const projects = await findAllProjects(vault, 'projects');
 * console.log(`Found ${projects.length} BAC4 projects:`);
 * for (const projectPath of projects) {
 *   console.log(' -', projectPath);
 * }
 * // Output:
 * // Found 3 BAC4 projects:
 * //  - projects/ecommerce-app
 * //  - projects/mobile-api
 * //  - projects/data-pipeline
 * ```
 */
export async function findAllProjects(vault: Vault, baseLocation: string): Promise<string[]> {
  const projects: string[] = [];

  try {
    const baseFolder = vault.getAbstractFileByPath(baseLocation);
    if (!baseFolder || !(baseFolder instanceof TFolder)) {
      return projects;
    }

    // Check each subfolder to see if it's a valid BAC4 project
    for (const child of baseFolder.children) {
      if (child instanceof TFolder) {
        const isValid = await isValidProject(vault, child.path);
        if (isValid) {
          projects.push(child.path);
        }
      }
    }
  } catch (error) {
    console.error('Error finding projects:', error);
  }

  return projects;
}
