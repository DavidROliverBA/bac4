# Markdown File Creation with Automatic Diagram Images

**Status:** ✅ Complete (All Phases)
**Version:** 0.8.0 (Implemented)

## Feature Overview

Enhanced markdown file creation that automatically exports the current diagram as a PNG image and embeds it in the markdown file with a properly formatted heading.

### User Story

**As a solution architect,** when I create a markdown documentation file for a node,
**I want** the current diagram automatically exported as a PNG and embedded in the markdown,
**So that** the documentation visually shows where the node sits in the architecture.

---

## ✅ Phase 1: Service Layer Implementation (COMPLETE)

### Changes to `markdown-link-service.ts`

#### New Methods Added:

1. **`exportDiagramAsPng()`** - Static method
   - Finds the React Flow container (`.react-flow`)
   - Validates dimensions
   - Uses `html-to-image` library to export as PNG
   - Returns base64 data URL
   - Throws error if export fails

2. **`saveDiagramImage()`** - Static method
   - Takes vault, image path, and data URL
   - Converts base64 data URL to binary
   - Creates or updates the PNG file in vault
   - Returns the created/updated TFile

3. **`createMarkdownFileWithImage()`** - Static method
   - Exports diagram as PNG
   - Saves PNG to same folder as markdown file
   - Generates markdown content with image reference
   - Creates markdown file
   - Returns both markdown and image files
   - Gracefully handles image export failure (continues with markdown creation)

4. **`updateDiagramImage()`** - Static method
   - Re-exports diagram as PNG
   - Updates the existing image file
   - Used for "Update Image" button functionality

5. **`getMarkdownTemplateWithImage()`** - Private method
   - Generates markdown template with embedded image
   - Adds heading: `## [Node Label] - [Context/Container/Component] Diagram`
   - Embeds image with Obsidian syntax: `![[image.png]]`
   - Inserts image section after heading and timestamp

### Image Heading Format

```markdown
# System 1

*Created: 2025-10-14*

## System 1 - Context Diagram

![[System_1.png]]

## Overview
...
```

The heading includes:
- Node label
- Diagram type (Context/Container/Component) with proper capitalization

---

## ✅ Phase 2: Hook Integration (COMPLETE)

### `useNodeHandlers.ts` - Updates Needed

**File:** `/src/ui/canvas/hooks/useNodeHandlers.ts`

#### 1. Add Interface Method

```typescript
export interface NodeHandlers {
  // ... existing methods
  updateMarkdownImage: (nodeId: string) => Promise<void>;
}
```

#### 2. Update `createAndLinkMarkdownFile` Method

**Current (lines 437-474):**
```typescript
const createAndLinkMarkdownFile = React.useCallback(
  async (nodeId: string, filePath: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
      console.error('BAC4: Node not found:', nodeId);
      return;
    }

    try {
      console.log('BAC4: Creating markdown file', { nodeId, filePath });
      await MarkdownLinkService.createMarkdownFile(  // ← OLD METHOD
        plugin.app.vault,
        filePath,
        node.data.label,
        node.type || 'generic'
      );
      // ... rest of method
    }
  },
  [nodes, plugin, linkMarkdownFile]
);
```

**Should Be:**
```typescript
const createAndLinkMarkdownFile = React.useCallback(
  async (nodeId: string, filePath: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
      console.error('BAC4: Node not found:', nodeId);
      return;
    }

    try {
      console.log('BAC4: Creating markdown file with diagram image', { nodeId, filePath });

      // NEW METHOD - creates markdown + PNG image
      const result = await MarkdownLinkService.createMarkdownFileWithImage(
        plugin.app.vault,
        filePath,
        node.data.label,
        node.type || 'generic',
        diagramType  // Pass current diagram type
      );

      console.log('BAC4: ✅ Markdown file created', {
        markdown: result.markdownFile.path,
        image: result.imageFile?.path || 'none'
      });

      // Link the file
      linkMarkdownFile(nodeId, filePath);

      // Open the file
      await MarkdownLinkService.openMarkdownFile(
        plugin.app.workspace,
        plugin.app.vault,
        filePath,
        false
      );
      console.log('BAC4: ✅ Markdown file opened');

      ErrorHandler.showSuccess(
        result.imageFile
          ? 'Markdown file created with diagram image'
          : 'Markdown file created (image export failed)'
      );
    } catch (error) {
      console.error('BAC4: Error creating markdown file:', error);
      ErrorHandler.handleError(error, 'Failed to create markdown file');
    }
  },
  [nodes, plugin, diagramType, linkMarkdownFile]  // Add diagramType to dependencies
);
```

#### 3. Add `updateMarkdownImage` Method

```typescript
/**
 * Update the diagram image for an existing markdown file
 */
const updateMarkdownImage = React.useCallback(
  async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.data.linkedMarkdownPath) {
      console.error('BAC4: No linked markdown file for node:', nodeId);
      ErrorHandler.showInfo('No linked markdown file to update image for');
      return;
    }

    try {
      console.log('BAC4: Updating diagram image for markdown:', node.data.linkedMarkdownPath);

      const imageFile = await MarkdownLinkService.updateDiagramImage(
        plugin.app.vault,
        node.data.linkedMarkdownPath
      );

      console.log('BAC4: ✅ Diagram image updated:', imageFile?.path);
      ErrorHandler.showSuccess('Diagram image updated successfully');
    } catch (error) {
      console.error('BAC4: Error updating diagram image:', error);
      ErrorHandler.handleError(error, 'Failed to update diagram image');
    }
  },
  [nodes, plugin]
);
```

#### 4. Return New Method

```typescript
return {
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  updateNodeLabel,
  updateNodeProperties,
  handleCreateOrOpenChildDiagram,
  handleDeleteNode,
  linkMarkdownFile,
  unlinkMarkdownFile,
  createAndLinkMarkdownFile,
  openLinkedMarkdownFile,
  updateMarkdownImage,  // ← ADD THIS
};
```

---

## ✅ Phase 3: PropertyPanel UI (COMPLETE)

### `PropertyPanel.tsx` - Updates Needed

**File:** `/src/ui/components/PropertyPanel.tsx`

#### 1. Add Prop Interface

```typescript
export interface PropertyPanelProps {
  // ... existing props
  onUpdateMarkdownImage?: (nodeId: string) => Promise<void>;
}
```

#### 2. Add Markdown File Actions Section

**Location:** In the "Linked Documentation" section where markdown file is displayed

**Current (approximate lines 825-895):**
```typescript
{!markdownFileExists ? (
  // File is linked but doesn't exist
  <div>
    <span>{MarkdownLinkService.getFileName(node.data.linkedMarkdownPath)} (not found)</span>
  </div>
  <div style={{ display: 'flex', gap: SPACING.small }}>
    <button onClick={handleCreateMarkdownFile}>
      Create File
    </button>
    <button onClick={handleUnlinkMarkdownFile}>
      Unlink
    </button>
  </div>
) : (
  // File exists
  <div>
    <span>{MarkdownLinkService.getFileName(node.data.linkedMarkdownPath)}</span>
  </div>
  <div style={{ display: 'flex', gap: SPACING.small }}>
    <button onClick={handleOpenMarkdownFile}>
      Open File
    </button>
    <button onClick={handleUnlinkMarkdownFile}>
      Unlink
    </button>
  </div>
)}
```

**Should Be:**
```typescript
{!markdownFileExists ? (
  // File is linked but doesn't exist
  <>
    <div>
      <span>{MarkdownLinkService.getFileName(node.data.linkedMarkdownPath)} (not found)</span>
    </div>
    <div style={{ display: 'flex', gap: SPACING.small }}>
      <button onClick={handleCreateMarkdownFile}>
        Create File
      </button>
      <button onClick={handleUnlinkMarkdownFile}>
        Unlink
      </button>
    </div>
  </>
) : (
  // File exists - ADD BUTTONS HERE
  <>
    <div>
      <span>{MarkdownLinkService.getFileName(node.data.linkedMarkdownPath)}</span>
    </div>
    <div style={{ display: 'flex', gap: SPACING.small, flexWrap: 'wrap' }}>
      <button
        onClick={handleOpenMarkdownFile}
        title="Open linked markdown file"
        style={{
          padding: SPACING.padding.button,
          background: UI_COLORS.interactiveNormal,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: BORDER_RADIUS.normal,
          color: UI_COLORS.textNormal,
          cursor: 'pointer',
          fontSize: FONT_SIZES.small,
        }}
      >
        📄 Open File
      </button>
      <button
        onClick={handleUpdateMarkdownImage}
        title="Update diagram image in markdown file"
        style={{
          padding: SPACING.padding.button,
          background: UI_COLORS.interactiveNormal,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: BORDER_RADIUS.normal,
          color: UI_COLORS.textNormal,
          cursor: 'pointer',
          fontSize: FONT_SIZES.small,
        }}
      >
        🔄 Update Image
      </button>
      <button
        onClick={handleUnlinkMarkdownFile}
        title="Unlink markdown file from node"
        style={{
          padding: SPACING.padding.button,
          background: UI_COLORS.interactiveNormal,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: BORDER_RADIUS.normal,
          color: UI_COLORS.textNormal,
          cursor: 'pointer',
          fontSize: FONT_SIZES.small,
        }}
      >
        ❌ Unlink
      </button>
    </div>
  </>
)}
```

#### 3. Add Handler Function

```typescript
const handleUpdateMarkdownImage = async () => {
  if (!node) return;
  await onUpdateMarkdownImage?.(node.id);
};
```

---

## ✅ Phase 4: Canvas View Integration (COMPLETE)

### `canvas-view.tsx` - Updates Needed

**File:** `/src/ui/canvas-view.tsx`

#### Pass New Handler to PropertyPanel

**Current (approximate line 462):**
```typescript
<PropertyPanel
  // ... existing props
  onCreateAndLinkMarkdownFile={nodeHandlers.createAndLinkMarkdownFile}
  onOpenLinkedMarkdownFile={nodeHandlers.openLinkedMarkdownFile}
/>
```

**Should Be:**
```typescript
<PropertyPanel
  // ... existing props
  onCreateAndLinkMarkdownFile={nodeHandlers.createAndLinkMarkdownFile}
  onOpenLinkedMarkdownFile={nodeHandlers.openLinkedMarkdownFile}
  onUpdateMarkdownImage={nodeHandlers.updateMarkdownImage}  // ← ADD THIS
/>
```

---

## 🧪 Testing Checklist

### Manual Testing Steps:

1. **Test New Markdown File Creation:**
   - [ ] Open a Context diagram
   - [ ] Select a System node
   - [ ] In PropertyPanel → Linked Documentation → Click "Link to Markdown File"
   - [ ] Provide a file path (e.g., `docs/System_1.md`)
   - [ ] Click "Create File"
   - [ ] Verify:
     - [ ] Markdown file created
     - [ ] PNG image created in same folder
     - [ ] Markdown contains heading: `## System 1 - Context Diagram`
     - [ ] Markdown contains image embed: `![[System_1.png]]`
     - [ ] Image displays correctly in Obsidian
     - [ ] Image shows the current diagram state

2. **Test Update Image:**
   - [ ] Continue from above test
   - [ ] Modify the diagram (add/move nodes)
   - [ ] Click "🔄 Update Image" button
   - [ ] Verify:
     - [ ] Image file is updated
     - [ ] Markdown file shows updated diagram
     - [ ] Old image is replaced, not duplicated

3. **Test Different Diagram Types:**
   - [ ] Test with Container diagram (should say "Container Diagram" in heading)
   - [ ] Test with Component diagram (should say "Component Diagram" in heading)
   - [ ] Test with cloud component node

4. **Test Error Handling:**
   - [ ] Test when diagram container not found (should fail gracefully)
   - [ ] Test when export fails (should create markdown without image)
   - [ ] Test update image when no linked file (should show info message)

5. **Test Open File Button:**
   - [ ] Click "📄 Open File" button
   - [ ] Verify markdown file opens in Obsidian

---

## Implementation Timeline

**Phase 1: Service Layer** ✅ Complete
- Estimated: 1 hour
- Actual: 1 hour

**Phase 2: Hook Integration** ✅ Complete
- Estimated: 30 minutes
- Actual: 15 minutes

**Phase 3: PropertyPanel UI** ✅ Complete
- Estimated: 45 minutes
- Actual: 20 minutes

**Phase 4: Canvas View Integration** ✅ Complete
- Estimated: 15 minutes
- Actual: 5 minutes

**Phase 5: Testing** ⏳ Ready for Manual Testing
- Estimated: 1 hour
- Status: Build successful, ready for user testing

**Total Estimated Time:** 3.5 hours
**Actual Time:** ~1.75 hours (50% faster than estimated)

---

## Files Modified

### ✅ All Complete:
- `/src/services/markdown-link-service.ts` (+210 lines)
  - Added 5 new methods for diagram image export and embedding
  - `exportDiagramAsPng()`, `saveDiagramImage()`, `createMarkdownFileWithImage()`, `updateDiagramImage()`, `getMarkdownTemplateWithImage()`
- `/src/ui/canvas/hooks/useNodeHandlers.ts` (+35 lines)
  - Extended NodeHandlers interface
  - Updated `createAndLinkMarkdownFile()` to use new service method
  - Added `updateMarkdownImage()` callback
- `/src/ui/components/PropertyPanel.tsx` (+50 lines, modified buttons)
  - Added `onUpdateMarkdownImage` prop
  - Updated markdown file display with 3 styled buttons (Open, Update Image, Unlink)
  - Added `handleUpdateMarkdownImage()` handler
- `/src/ui/canvas-view.tsx` (+1 line)
  - Passed `onUpdateMarkdownImage` to PropertyPanel

---

## Technical Notes

### Image Export Implementation

Uses `html-to-image` library (already a dependency):
- `toPng()` function exports React Flow container
- High quality PNG export (same settings as manual export)
- Synchronous operation (no delay needed)

### Image Storage

- Images stored in same folder as markdown file
- Naming convention: `[markdown-name].png` (e.g., `System_1.md` → `System_1.png`)
- Obsidian wiki-link format: `![[System_1.png]]`
- Images are vault-relative (work with Obsidian's file system)

### Update vs. Create

- **Create:** Creates both markdown + image
- **Update:** Only updates the image, preserves markdown content
- No duplication: `modifyBinary()` updates existing file

### Error Handling

- Export failures are logged but don't block markdown creation
- User sees appropriate success/warning messages
- Markdown file always created (even if image fails)

---

## Future Enhancements

### v0.9.0+ (Possible):
- [ ] Auto-update image on diagram changes (optional setting)
- [ ] Multiple image formats (SVG for vector)
- [ ] Image versioning (keep history of diagrams)
- [ ] Batch update all markdown images in project
- [ ] Custom image placement in template
- [ ] Image compression settings
- [ ] Dark mode aware exports

---

## Dependencies

**Required:**
- `html-to-image` ✅ Already installed
- `obsidian` API ✅ Already available
- Existing export utilities ✅ Already implemented

**No new dependencies needed!**

---

## Breaking Changes

**None.** This is a purely additive feature.

- Old `createMarkdownFile()` method still exists and works
- New `createMarkdownFileWithImage()` is separate method
- Graceful fallback if image export fails
- No changes to file format or data structure

---

## Documentation Updates Needed

### After Implementation:
1. Update README.md - Add "Auto-Diagram Screenshots" to features list
2. Update CLAUDE.md - Document new MarkdownLinkService methods
3. Create user guide in docs/ - "How to Use Linked Documentation"
4. Update roadmap - Mark v0.8.0 as complete
5. Create release notes for v0.8.0

---

**Last Updated:** 2025-10-15
**Status:** ✅ Implementation Complete (All Phases 1-4)
**Ready For:** Manual Testing (Phase 5)
**Implementer:** David Oliver + Claude Code
