# Prompt 2: Convert BAC4 to Markdown with Frontmatter Support

## Objective
Convert the BAC4 plugin to support both `.bac4` (JSON) and `.md` (markdown with YAML frontmatter) file formats, allowing users to add documentation alongside their diagrams while maintaining full backwards compatibility.

## Requirements

### 1. File Format Support

#### A. Maintain .bac4 Support (Backwards Compatibility)
- Keep existing `.bac4` file format working
- Pure JSON format: `{ "nodes": [...], "edges": [...] }`
- Auto-opens in canvas view
- No changes to existing behavior

#### B. Add .md Support with Frontmatter
New markdown format:
```markdown
---
bac4_diagram: true
bac4_type: context
bac4_data: |
  {
    "nodes": [...],
    "edges": [...]
  }
---

# Diagram Title

User documentation goes here...

## Architecture Notes
- Design decisions
- Component descriptions
- Links to other diagrams: [[Related Diagram]]
```

### 2. File Detection & View Switching

#### A. Automatic Detection
- **For .bac4 files**: Always open in canvas view (existing behavior)
- **For .md files**: Check frontmatter for `bac4_diagram: true` flag
  - If flag present: Open in canvas view automatically
  - If flag absent: Open in normal markdown view

#### B. Manual Toggle Commands
Add Command Palette commands:
- `BAC4: Open as Diagram` - Switch markdown file to canvas view
- `BAC4: Open as Markdown` - Switch canvas view to markdown editor
- `BAC4: Convert .bac4 to Markdown` - Migrate existing diagram to .md format
- `BAC4: Convert Markdown to .bac4` - Extract diagram data to pure JSON

#### C. Context Menu Integration
Add right-click menu options:
- On .md files with `bac4_diagram: true`: "Open as BAC4 Diagram"
- On .bac4 files: "Convert to Markdown"
- In canvas view: "View as Markdown Source"

#### D. Ribbon Icon Toggle
Add toolbar button to switch between:
- Canvas view (visual diagram editor)
- Markdown view (source + documentation)

### 3. File I/O Changes

#### A. Reading Files
Update `canvas-view.tsx` file loading logic:
```typescript
// Detect file format
if (filePath.endsWith('.bac4')) {
  // Load as pure JSON
  const data = JSON.parse(content);
  return { nodes: data.nodes, edges: data.edges };
} else if (filePath.endsWith('.md')) {
  // Parse frontmatter
  const { frontmatter, body } = parseFrontmatter(content);
  if (frontmatter.bac4_data) {
    // Load diagram data from frontmatter
    const data = JSON.parse(frontmatter.bac4_data);
    return { nodes: data.nodes, edges: data.edges, markdown: body };
  }
}
```

#### B. Writing Files
Update auto-save logic:
```typescript
// For .md files, preserve frontmatter + body
if (filePath.endsWith('.md')) {
  const frontmatter = {
    bac4_diagram: true,
    bac4_type: diagramType,
    bac4_data: JSON.stringify({ nodes, edges }, null, 2)
  };
  const content = buildMarkdownWithFrontmatter(frontmatter, markdownBody);
  await write(filePath, content);
} else {
  // For .bac4 files, save as pure JSON
  await write(filePath, JSON.stringify({ nodes, edges }, null, 2));
}
```

### 4. View Type Management

#### A. Register Multiple Extensions
```typescript
// Register .bac4 extension
this.registerExtensions(['bac4'], VIEW_TYPE_CANVAS);

// Override markdown view for BAC4 diagrams
this.registerEvent(
  this.app.workspace.on('file-open', (file) => {
    if (file.extension === 'md') {
      checkAndSwitchToCanvasView(file);
    }
  })
);
```

#### B. View State Management
- Track whether user is viewing diagram or markdown
- Preserve view preference per file
- Remember last view mode in workspace state

### 5. UI Enhancements

#### A. Mode Indicator
Add visual indicator showing current mode:
- "📊 Diagram View" or "📝 Markdown View"
- Display in header or status bar

#### B. Split View (Optional Enhancement)
Consider adding split view option:
- Left: Canvas diagram editor
- Right: Markdown documentation editor
- Live sync between views

#### C. Markdown Preview in Property Panel
When viewing .md diagram, show markdown preview in property panel or sidebar.

### 6. Migration Tools

#### A. Bulk Conversion Command
`BAC4: Convert All .bac4 to Markdown`
- Scan vault for all .bac4 files
- Convert each to .md format
- Preserve diagram data
- Add default markdown template
- Update diagram-relationships.json

#### B. Conversion Modal
Show modal with options:
- [ ] Keep original .bac4 files
- [ ] Delete .bac4 after conversion
- [ ] Add default documentation template
- [ ] Update all links/references

### 7. Documentation Template

When converting or creating new .md diagrams, add helpful template:

```markdown
---
bac4_diagram: true
bac4_type: context
bac4_created: 2025-01-11T12:00:00Z
bac4_updated: 2025-01-11T12:00:00Z
bac4_data: |
  {...}
tags:
  - architecture
  - c4-model
---

# [Diagram Name]

## Overview
Brief description of what this diagram represents.

## Components

### Systems
- **System 1**: Description
- **System 2**: Description

### Actors
- **Person 1**: Role description

## Relationships
- System 1 → System 2: Relationship description

## Design Decisions
Document architectural decisions here.

## Related Diagrams
- [[Parent Diagram]]
- [[Child Diagram 1]]
- [[Child Diagram 2]]

## Notes
Additional context, considerations, or future plans.
```

### 8. Update Diagram Relationships

#### A. Support Both File Types
Update `diagram-relationships.json` to track file type:
```json
{
  "diagrams": [{
    "id": "...",
    "filePath": "System.md",
    "fileType": "markdown",
    "displayName": "...",
    "type": "context"
  }]
}
```

#### B. Link Resolution
Ensure child diagram creation works with both formats:
- Parent .bac4 can create child .md
- Parent .md can create child .bac4 or .md
- User preference for default format

### 9. Settings

Add plugin settings:
```typescript
interface BAC4Settings {
  // Existing settings...

  // New settings
  defaultFileFormat: 'bac4' | 'markdown';
  autoDetectMarkdownDiagrams: boolean;
  includeDocumentationTemplate: boolean;
  preserveBac4Files: boolean; // During conversion
  markdownTemplateContent: string;
}
```

Settings UI:
- **Default File Format**: Choose .bac4 or .md for new diagrams
- **Auto-detect Markdown Diagrams**: Automatically open .md files with frontmatter in canvas view
- **Include Documentation Template**: Add default markdown template to new .md diagrams
- **Preserve Original Files**: Keep .bac4 files when converting to .md

### 10. Error Handling

#### A. Invalid Frontmatter
- Gracefully handle malformed YAML
- Show error message with line number
- Fallback to markdown view if parsing fails

#### B. Missing bac4_data
- Detect empty or missing diagram data
- Offer to initialize with empty canvas
- Don't break if user removes frontmatter

#### C. File Type Conflicts
- Warn if both System.bac4 and System.md exist
- Prompt user to resolve conflict
- Prevent duplicate registrations in relationships.json

### 11. Testing Requirements

#### Test Cases:
1. ✅ Load existing .bac4 file - should work as before
2. ✅ Load .md file with frontmatter - should open in canvas view
3. ✅ Load .md file without frontmatter - should open in markdown view
4. ✅ Save diagram to .md format - should preserve markdown body
5. ✅ Toggle between canvas and markdown views
6. ✅ Convert .bac4 to .md and back
7. ✅ Auto-detect on file open
8. ✅ Command palette commands work
9. ✅ Context menu options appear correctly
10. ✅ Bulk conversion preserves all diagram data
11. ✅ Relationships file updates correctly
12. ✅ Child diagram creation works with both formats

### 12. Implementation Order

#### Phase 1: Core Reading/Writing
1. Add frontmatter parser utility
2. Update file reading logic to support both formats
3. Update file writing logic to support both formats
4. Test basic load/save with .md files

#### Phase 2: View Detection
5. Implement frontmatter detection
6. Add file-open event handler
7. Add automatic view switching
8. Test auto-detection

#### Phase 3: Commands & UI
9. Add command palette commands
10. Add context menu options
11. Add ribbon toggle button
12. Add mode indicator

#### Phase 4: Conversion Tools
13. Implement .bac4 → .md converter
14. Implement .md → .bac4 converter
15. Add bulk conversion command
16. Create conversion modal

#### Phase 5: Templates & Settings
17. Create documentation template
18. Add plugin settings
19. Add settings UI
20. Test template insertion

#### Phase 6: Polish & Testing
21. Update diagram-relationships.json handling
22. Add error handling
23. Comprehensive testing
24. Update documentation

## Success Criteria

### Must Have:
- ✅ .bac4 files continue to work exactly as before
- ✅ .md files with frontmatter open in canvas view
- ✅ Can add markdown documentation to diagrams
- ✅ Can toggle between canvas and markdown views
- ✅ Auto-save preserves both diagram data and markdown
- ✅ No data loss during conversions
- ✅ Command palette commands work

### Nice to Have:
- ✅ Bulk conversion tool
- ✅ Documentation template
- ✅ Split view mode
- ✅ Markdown preview in property panel
- ✅ Settings UI

## Technical Notes

### Dependencies
- YAML parser (use Obsidian's built-in parser or `js-yaml`)
- Frontmatter parser (`gray-matter` or custom)

### Files to Modify
1. `src/main.ts` - Add extension registration and event handlers
2. `src/ui/canvas-view.tsx` - Update file I/O logic
3. `src/services/diagram-navigation-service.ts` - Support both file types
4. `src/core/settings.ts` - Add new settings
5. Create `src/utils/frontmatter-parser.ts` - Utility for parsing
6. Create `src/utils/markdown-template.ts` - Template generator

### New Commands
- `bac4:open-as-diagram`
- `bac4:open-as-markdown`
- `bac4:convert-to-markdown`
- `bac4:convert-to-bac4`
- `bac4:bulk-convert-to-markdown`

## Questions to Resolve

1. **Default format for new diagrams**: .bac4 or .md?
   - Recommendation: .md (more Obsidian-native)

2. **Conversion strategy**: Preserve or delete .bac4 after conversion?
   - Recommendation: User choice in settings

3. **Child diagram format**: Match parent or use default?
   - Recommendation: User setting with "match parent" option

4. **Markdown in property panel**: Show or hide?
   - Recommendation: Optional toggle

5. **Split view**: Implement now or later?
   - Recommendation: Later (Phase 2 enhancement)

## End Result

Users will be able to:
1. Create diagrams as either .bac4 or .md files
2. Add rich markdown documentation to diagrams
3. Search and link diagrams in Obsidian's graph view
4. Toggle between visual and source views
5. Migrate existing diagrams to markdown format
6. Keep diagram data version-controlled with readable diffs

The plugin will remain fully backwards compatible with existing .bac4 files while offering enhanced functionality for users who want integrated documentation.
