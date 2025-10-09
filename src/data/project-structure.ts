import { TFolder, Vault } from 'obsidian';

/**
 * BAC4 Project Folder Structure
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
 */
export interface ProjectFiles {
  metadata: string; // project.json
  readme: string; // README.md
}

/**
 * Get the folder structure for a BAC4 project
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
 * Get the required files for a BAC4 project
 */
export function getProjectFiles(projectName: string, baseLocation: string): ProjectFiles {
  const root = `${baseLocation}/${projectName}`;
  return {
    metadata: `${root}/project.json`,
    readme: `${root}/README.md`,
  };
}

/**
 * Create the folder structure for a new BAC4 project
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
 * Get all BAC4 projects in the vault
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
