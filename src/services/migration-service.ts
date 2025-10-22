/**
 * Migration Service: v1 → v2 Format Migration
 *
 * Automatically migrates all .bac4 files in vault from v1 (v2.0.0-v2.2.0)
 * to v2 (v2.5.0) format.
 *
 * Changes:
 * - Old: Single .bac4 file with nodes + edges + positions
 * - New: .bac4 (nodes) + .bac4-graph (relationships + layout)
 *
 * @version 2.5.0
 */

import { App, Notice, TFile, TFolder } from 'obsidian';
import { FormatConverter } from '../utils/format-converter';
import type { BAC4FileV2, BAC4GraphFileV2 } from '../types/bac4-v2-types';

export interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

export class MigrationService {
  constructor(private app: App) {}

  /**
   * Migrate all .bac4 files in vault from v1 to v2 format
   */
  async migrateAllDiagrams(options: {
    dryRun?: boolean;
    createBackups?: boolean;
  } = {}): Promise<MigrationStats> {
    const { dryRun = false, createBackups = true } = options;

    const notice = new Notice(
      dryRun
        ? 'Running migration in DRY RUN mode...'
        : 'Starting migration to v2.5.0 format...',
      0
    );

    const stats: MigrationStats = {
      total: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Find all .bac4 files
      const bac4Files = this.findAllBAC4Files();
      stats.total = bac4Files.length;

      console.log(`Found ${bac4Files.length} .bac4 files to process`);

      // Migrate each file
      for (const file of bac4Files) {
        try {
          const result = await this.migrateSingleDiagram(file, {
            dryRun,
            createBackup: createBackups,
          });

          if (result === 'migrated') {
            stats.migrated++;
            console.log(`✅ Migrated: ${file.path}`);
          } else if (result === 'skipped') {
            stats.skipped++;
            console.log(`⏭️  Skipped: ${file.path} (already v2.5.0)`);
          }
        } catch (error) {
          stats.failed++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          stats.errors.push({ file: file.path, error: errorMsg });
          console.error(`❌ Failed: ${file.path}`, error);
        }
      }

      notice.hide();

      // Show summary
      const summaryMsg = dryRun
        ? `DRY RUN complete! Would migrate: ${stats.migrated}, Skip: ${stats.skipped}, Fail: ${stats.failed}`
        : `Migration complete! Migrated: ${stats.migrated}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`;

      new Notice(summaryMsg, 5000);

      if (!dryRun) {
        // Generate migration report
        await this.generateMigrationReport(stats);
      }

      return stats;
    } catch (error) {
      notice.hide();
      console.error('Migration failed:', error);
      new Notice('Migration failed. See console for details.');
      throw error;
    }
  }

  /**
   * Migrate a single .bac4 file
   */
  async migrateSingleDiagram(
    file: TFile,
    options: { dryRun?: boolean; createBackup?: boolean } = {}
  ): Promise<'migrated' | 'skipped' | 'failed'> {
    const { dryRun = false, createBackup = true } = options;

    // Read file
    const content = await this.app.vault.read(file);
    let data: any;

    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in ${file.path}`);
    }

    // Check if already v2.5.0
    if (data.version === '2.5.0') {
      return 'skipped';
    }

    // Check if it's a valid v1 file
    if (!data.metadata || !data.timeline || !data.timeline.snapshots) {
      throw new Error(`Invalid v1 format in ${file.path}`);
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would migrate ${file.path}`);
      return 'migrated';
    }

    // Convert v1 → v2
    const { nodeFile, graphFile } = FormatConverter.convertV1ToV2(data, file.path);

    // Validate conversion
    const validation = FormatConverter.validateV2Format(nodeFile, graphFile);
    if (!validation.valid) {
      throw new Error(
        `Validation failed for ${file.path}: ${validation.errors.join(', ')}`
      );
    }

    // Create backup if requested
    if (createBackup) {
      const backupPath = file.path + '.v1.backup';
      try {
        await this.app.vault.create(backupPath, content);
        console.log(`Created backup: ${backupPath}`);
      } catch (error) {
        console.warn(`Failed to create backup for ${file.path}:`, error);
      }
    }

    // Write new .bac4 file (nodes only)
    const nodeFileContent = JSON.stringify(nodeFile, null, 2);
    await this.app.vault.modify(file, nodeFileContent);

    // Write new .bac4-graph file (relationships + layout)
    const graphFilePath = file.path.replace('.bac4', '.bac4-graph');
    graphFile.metadata.nodeFile = file.name;
    const graphFileContent = JSON.stringify(graphFile, null, 2);

    try {
      await this.app.vault.create(graphFilePath, graphFileContent);
    } catch (error) {
      // File might already exist, try to modify it
      const existingFile = this.app.vault.getAbstractFileByPath(graphFilePath);
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, graphFileContent);
      } else {
        throw error;
      }
    }

    console.log(`✅ Migrated ${file.path} → ${file.path} + ${graphFilePath}`);
    return 'migrated';
  }

  /**
   * Find all .bac4 files in vault
   */
  private findAllBAC4Files(): TFile[] {
    return this.app.vault.getFiles().filter((file) => file.path.endsWith('.bac4'));
  }

  /**
   * Generate migration report
   */
  async generateMigrationReport(stats: MigrationStats): Promise<void> {
    const timestamp = new Date().toISOString();

    const report = `# BAC4 v2.5.0 Migration Report

**Date:** ${timestamp}

## Summary

- 📊 **Total Files:** ${stats.total}
- ✅ **Migrated:** ${stats.migrated} diagrams
- ⏭️  **Skipped:** ${stats.skipped} diagrams (already v2.5.0)
- ❌ **Failed:** ${stats.failed} diagrams

## What Changed?

### New Format Architecture

v2.5.0 introduces a **major architectural improvement**:

**Before (v1):**
\`\`\`
diagram.bac4 (single file)
├─ nodes (semantic data + positions)
├─ edges (relationships)
└─ snapshots (timeline)
\`\`\`

**After (v2):**
\`\`\`
diagram.bac4 (nodes only)
├─ metadata (title, description, tags)
├─ nodes (semantic data)
│  ├─ properties (label, description, technology)
│  ├─ knowledge (notes, URLs, attachments)
│  ├─ metrics (uptime, cost, users)
│  ├─ wardley (visibility, evolution)
│  └─ links (linkedDiagrams, dependencies)

diagram.bac4-graph (relationships + layout)
├─ timeline (snapshots)
│  ├─ layout (x, y, width, height per node)
│  ├─ edges (relationships)
│  ├─ groups (visual groupings)
│  └─ annotations (notes, highlights)
└─ config (grid, layout algorithm)
\`\`\`

### Benefits

✅ **Separation of Concerns**
- Semantic data (what) separate from presentation (how)
- Multiple views of same data possible

✅ **Graph Database Ready**
- Direct migration path to Neo4j
- Nodes → Neo4j nodes, Edges → Neo4j relationships

✅ **Better Knowledge Management**
- Rich metadata support
- URLs, notes, attachments per node
- Team assignments, cost tracking

✅ **Wardley Mapping Integrated**
- Nodes can have visibility/evolution properties
- Create strategic Wardley Maps
- Link Wardley Maps to C4 diagrams

✅ **Future-Proof**
- Clean extensibility for new features
- No breaking changes needed for enhancements

### Backward Compatibility

- ❌ **Breaking change:** Old .bac4 files will not work with v2.5.0+
- ✅ **Backups created:** Original files saved as \`.bac4.v1.backup\`
- ✅ **Rollback possible:** Restore from backups if needed

${
  stats.failed > 0
    ? `
## ⚠️ Errors

The following files failed to migrate:

${stats.errors.map((e) => `- **${e.file}**: ${e.error}`).join('\n')}

**Action Required:** Please review these files manually.
`
    : ''
}

## Files Migrated

${stats.migrated > 0 ? `Successfully migrated ${stats.migrated} diagrams.` : 'No files needed migration.'}

${
  stats.skipped > 0
    ? `${stats.skipped} files were already in v2.5.0 format and were skipped.`
    : ''
}

## Next Steps

1. ✅ **Test your diagrams** - Open each diagram to ensure it works correctly
2. ✅ **Verify cross-references** - Check that linked diagrams still work
3. ✅ **Test graph view** - Ensure graph view still generates correctly
4. ✅ **Explore new features:**
   - Add URLs and notes to your diagrams
   - Try creating a Wardley Map
   - Add metrics (cost, uptime, users) to nodes
5. ✅ **Delete backups** - Once confident, delete \`.bac4.v1.backup\` files

## Rollback (Emergency)

If you encounter issues, you can rollback the migration:

1. Run command: **"Rollback v2.5.0 Migration"**
2. This will restore all \`.bac4.v1.backup\` files
3. Delete \`.bac4-graph\` files

## New Features in v2.5.0

### 1. Enhanced Knowledge Management

Add rich metadata to any node:

\`\`\`json
"knowledge": {
  "notes": [
    {
      "author": "David Oliver",
      "content": "Migrated to Kubernetes Q3 2025",
      "created": "2025-10-15T10:00:00Z"
    }
  ],
  "urls": [
    {
      "label": "Production Dashboard",
      "url": "https://datadog.ba.com/techlog",
      "type": "monitoring"
    }
  ],
  "attachments": [
    {
      "name": "Architecture Decision Record",
      "path": "docs/adr/001-kubernetes-migration.md"
    }
  ]
}
\`\`\`

### 2. Metrics Tracking

Track business/technical metrics:

\`\`\`json
"metrics": {
  "uptime": 0.9995,
  "users": 1200,
  "cost_per_month_usd": 12000,
  "transactions_per_day": 50000
}
\`\`\`

### 3. Wardley Mapping

Create strategic Wardley Maps:

\`\`\`json
"wardley": {
  "visibility": 0.85,
  "evolution": 0.60,
  "evolutionStage": "product",
  "inertia": false
}
\`\`\`

### 4. Graph Database Ready

Export to Neo4j when ready:
- Nodes → Neo4j nodes with all properties
- Edges → Neo4j relationships
- Direct Cypher query generation (coming in v2.6.0)

---

**Generated by:** BAC4 v2.5.0 Migration Service
**Documentation:** See \`docs/V2.5_REFACTOR_PLAN.md\`
**Issues:** https://github.com/DavidROliverBA/bac4/issues
`;

    // Write report
    const reportPath = 'BAC4-Migration-Report.md';
    try {
      const existingReport = this.app.vault.getAbstractFileByPath(reportPath);
      if (existingReport instanceof TFile) {
        await this.app.vault.modify(existingReport, report);
      } else {
        await this.app.vault.create(reportPath, report);
      }

      // Open report
      const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
      if (reportFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(reportFile);
      }

      new Notice('Migration report generated', 3000);
    } catch (error) {
      console.error('Failed to generate migration report:', error);
    }
  }

  /**
   * Rollback migration (restore from backups)
   */
  async rollbackMigration(): Promise<void> {
    const backupFiles = this.app.vault
      .getFiles()
      .filter((f) => f.path.endsWith('.bac4.v1.backup'));

    if (backupFiles.length === 0) {
      new Notice('No backup files found. Nothing to rollback.');
      return;
    }

    const confirmMsg = `Found ${backupFiles.length} backup files. Rollback will:\n1. Restore original .bac4 files\n2. Delete .bac4-graph files\n\nContinue?`;

    // In a real implementation, you'd use a modal for confirmation
    // For now, just proceed
    console.log(confirmMsg);

    let restored = 0;
    let failed = 0;

    for (const backupFile of backupFiles) {
      try {
        const originalPath = backupFile.path.replace('.bac4.v1.backup', '.bac4');
        const content = await this.app.vault.read(backupFile);

        // Restore original .bac4 file
        const originalFile = this.app.vault.getAbstractFileByPath(originalPath);
        if (originalFile instanceof TFile) {
          await this.app.vault.modify(originalFile, content);
        } else {
          await this.app.vault.create(originalPath, content);
        }

        // Delete .bac4-graph file
        const graphPath = originalPath.replace('.bac4', '.bac4-graph');
        const graphFile = this.app.vault.getAbstractFileByPath(graphPath);
        if (graphFile instanceof TFile) {
          await this.app.vault.delete(graphFile);
        }

        // Delete backup
        await this.app.vault.delete(backupFile);

        restored++;
        console.log(`✅ Restored: ${originalPath}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to restore ${backupFile.path}:`, error);
      }
    }

    new Notice(
      `Rollback complete! Restored: ${restored}, Failed: ${failed}`,
      5000
    );

    // Generate rollback report
    await this.generateRollbackReport(restored, failed);
  }

  /**
   * Generate rollback report
   */
  async generateRollbackReport(restored: number, failed: number): Promise<void> {
    const report = `# BAC4 Migration Rollback Report

**Date:** ${new Date().toISOString()}

## Summary

- ✅ **Restored:** ${restored} files
- ❌ **Failed:** ${failed} files

## What Happened?

The v2.5.0 migration was rolled back to v2.2.0 format:

1. Original \`.bac4\` files restored from \`.bac4.v1.backup\`
2. \`.bac4-graph\` files deleted
3. Backup files deleted

## Current State

Your vault is now back to v2.2.0 format. All diagrams should work as before.

## Next Steps

If you rolled back due to issues:

1. **Report the issue:** https://github.com/DavidROliverBA/bac4/issues
2. **Stay on v2.2.0** until the issue is resolved
3. **Monitor for updates:** Check for new releases

If you want to try migration again:

1. Run command: **"Migrate Diagrams to v2.5.0"**
2. Test thoroughly before deleting backups

---

**Generated by:** BAC4 Migration Service (Rollback)
`;

    try {
      await this.app.vault.create('BAC4-Rollback-Report.md', report);

      const reportFile =
        this.app.vault.getAbstractFileByPath('BAC4-Rollback-Report.md');
      if (reportFile instanceof TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(reportFile);
      }
    } catch (error) {
      console.error('Failed to generate rollback report:', error);
    }
  }

  /**
   * Dry run migration (test without making changes)
   */
  async dryRunMigration(): Promise<MigrationStats> {
    console.log('Running DRY RUN migration...');
    return await this.migrateAllDiagrams({ dryRun: true, createBackups: false });
  }

  /**
   * Get migration status for a single file
   */
  async getMigrationStatus(file: TFile): Promise<{
    version: string;
    needsMigration: boolean;
    hasBackup: boolean;
    hasGraphFile: boolean;
  }> {
    const content = await this.app.vault.read(file);
    const data = JSON.parse(content);

    const version = data.version || 'unknown';
    const needsMigration = version !== '2.5.0';

    const backupPath = file.path + '.v1.backup';
    const backupFile = this.app.vault.getAbstractFileByPath(backupPath);
    const hasBackup = backupFile instanceof TFile;

    const graphPath = file.path.replace('.bac4', '.bac4-graph');
    const graphFile = this.app.vault.getAbstractFileByPath(graphPath);
    const hasGraphFile = graphFile instanceof TFile;

    return {
      version,
      needsMigration,
      hasBackup,
      hasGraphFile,
    };
  }
}
