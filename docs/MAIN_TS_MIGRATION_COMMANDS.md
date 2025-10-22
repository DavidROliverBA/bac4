# Migration Commands for main.ts

Add these commands to `src/main.ts` to enable v2.5.0 migration functionality.

## Import Statements

Add to the top of `main.ts`:

```typescript
import { MigrationService } from './services/migration-service';
```

## Commands to Add

Add these commands in the `onload()` method, in the command registration section:

```typescript
// ========================================================================
// Migration Commands (v2.5.0)
// ========================================================================

this.addCommand({
  id: 'migrate-to-v2-5',
  name: 'Migrate Diagrams to v2.5.0 Format',
  callback: async () => {
    const migrationService = new MigrationService(this.app);

    // Confirm before migrating
    const confirmModal = new ConfirmationModal(
      this.app,
      'Migrate to v2.5.0 Format',
      `This will migrate all .bac4 files to the new v2.5.0 format.

**What will happen:**
• Each .bac4 file will be split into two files:
  - .bac4 (nodes/semantic data)
  - .bac4-graph (relationships/layout)
• Backups will be created (.bac4.v1.backup)
• A migration report will be generated

**This is a breaking change.** Old plugins will not work with new format.

Continue with migration?`,
      async () => {
        new Notice('Starting migration...', 3000);
        const stats = await migrationService.migrateAllDiagrams({
          dryRun: false,
          createBackups: true,
        });

        if (stats.failed > 0) {
          new Notice(
            `Migration completed with errors. ${stats.migrated} migrated, ${stats.failed} failed. See report for details.`,
            10000
          );
        } else {
          new Notice(
            `Migration complete! ${stats.migrated} diagrams migrated successfully.`,
            5000
          );
        }
      }
    );
    confirmModal.open();
  },
});

this.addCommand({
  id: 'dry-run-migration',
  name: 'Dry Run Migration (Test Only)',
  callback: async () => {
    new Notice('Running dry run migration (no changes will be made)...', 3000);

    const migrationService = new MigrationService(this.app);
    const stats = await migrationService.dryRunMigration();

    const message = `Dry run complete!

Would migrate: ${stats.migrated}
Would skip: ${stats.skipped}
Would fail: ${stats.failed}

No changes were made. Run "Migrate Diagrams to v2.5.0" to perform actual migration.`;

    new Notice(message, 10000);
    console.log('BAC4 v2.5: Dry run results:', stats);
  },
});

this.addCommand({
  id: 'rollback-migration',
  name: 'Rollback v2.5.0 Migration (Emergency)',
  callback: async () => {
    const confirmModal = new ConfirmationModal(
      this.app,
      'Rollback Migration',
      `This will rollback the v2.5.0 migration.

**What will happen:**
• Restore original .bac4 files from backups
• Delete .bac4-graph files
• Delete backup files

**Warning:** This will undo all changes made during migration.

Continue with rollback?`,
      async () => {
        new Notice('Rolling back migration...', 3000);

        const migrationService = new MigrationService(this.app);
        await migrationService.rollbackMigration();
      }
    );
    confirmModal.open();
  },
});

this.addCommand({
  id: 'show-migration-status',
  name: 'Show Migration Status',
  callback: async () => {
    const migrationService = new MigrationService(this.app);
    const bac4Files = this.app.vault.getFiles().filter((f) => f.path.endsWith('.bac4'));

    if (bac4Files.length === 0) {
      new Notice('No .bac4 files found in vault');
      return;
    }

    let v1Count = 0;
    let v2Count = 0;
    let unknownCount = 0;

    for (const file of bac4Files) {
      try {
        const status = await migrationService.getMigrationStatus(file);
        if (status.version === '2.5.0') {
          v2Count++;
        } else if (status.version.startsWith('2.')) {
          v1Count++;
        } else {
          unknownCount++;
        }
      } catch (error) {
        unknownCount++;
      }
    }

    const message = `Migration Status:

Total .bac4 files: ${bac4Files.length}
• v2.5.0 (new format): ${v2Count}
• v1 (old format): ${v1Count}
• Unknown/Error: ${unknownCount}

${
  v1Count > 0
    ? `\n⚠️ ${v1Count} files need migration. Run "Migrate Diagrams to v2.5.0".`
    : '✅ All files are up to date!'
}`;

    new Notice(message, 10000);
    console.log('BAC4 v2.5: Migration status:', { v1Count, v2Count, unknownCount });
  },
});
```

## ConfirmationModal Class

Add this modal class to `main.ts` (or create a separate file):

```typescript
class ConfirmationModal extends Modal {
  constructor(
    app: App,
    private title: string,
    private message: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: this.title });
    contentEl.createEl('p', { text: this.message, attr: { style: 'white-space: pre-wrap' } });

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const confirmButton = buttonContainer.createEl('button', { text: 'Continue' });
    confirmButton.style.flex = '1';
    confirmButton.addEventListener('click', () => {
      this.close();
      this.onConfirm();
    });

    const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelButton.style.flex = '1';
    cancelButton.addEventListener('click', () => {
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
```

## Auto-Migration on Plugin Load (Optional)

Add this to the `onload()` method if you want automatic migration:

```typescript
async onload() {
  await this.loadSettings();

  // Check if migration to v2.5.0 is needed
  if (!this.settings.migratedToV2_5) {
    console.log('BAC4 v2.5: Migration check - not yet migrated');

    // Count v1 files
    const bac4Files = this.app.vault.getFiles().filter((f) => f.path.endsWith('.bac4'));
    let needsMigration = false;

    for (const file of bac4Files) {
      try {
        const content = await this.app.vault.read(file);
        const data = JSON.parse(content);
        if (data.version !== '2.5.0') {
          needsMigration = true;
          break;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    if (needsMigration) {
      // Show notice with option to migrate
      new Notice(
        'BAC4 v2.5.0: Migration available. Run "Migrate Diagrams to v2.5.0" from command palette.',
        15000
      );
    } else {
      // No files need migration, mark as complete
      this.settings.migratedToV2_5 = true;
      await this.saveSettings();
    }
  }

  // Continue with normal plugin initialization...
}
```

## Settings Interface

Add this to the settings interface:

```typescript
interface BAC4Settings {
  // ... existing settings ...
  migratedToV2_5: boolean;
}

const DEFAULT_SETTINGS: Partial<BAC4Settings> = {
  // ... existing defaults ...
  migratedToV2_5: false,
};
```

---

## Testing the Commands

1. **Test Dry Run First:**
   ```
   Cmd+P → "Dry Run Migration"
   ```
   - Verify it shows correct count
   - Verify no files are changed

2. **Test Migration:**
   ```
   Cmd+P → "Migrate Diagrams to v2.5.0"
   ```
   - Verify backups are created
   - Verify .bac4-graph files are created
   - Verify migration report is generated

3. **Test Rollback:**
   ```
   Cmd+P → "Rollback v2.5.0 Migration"
   ```
   - Verify files are restored
   - Verify .bac4-graph files are deleted

4. **Test Status:**
   ```
   Cmd+P → "Show Migration Status"
   ```
   - Verify correct counts

---

## Next Steps

After adding these commands:

1. Build the plugin
2. Test in vault with one .bac4 file first
3. Test dry run
4. Test actual migration
5. Test rollback
6. Test with full BA Engineering vault (16 diagrams)

