# Accessibility (a11y) Guide

**Date:** 2025-10-12
**Phase:** 4.3 - Accessibility Improvements

## Summary

This document outlines accessibility features and considerations for the BAC4 Plugin to ensure usability for all users, including those using assistive technologies.

---

## Current Accessibility Features

### Keyboard Navigation

#### **Canvas Navigation**
- ✅ **Tab Navigation:** Focus moves through interactive elements
- ✅ **Arrow Keys:** Pan canvas (handled by React Flow)
- ✅ **Space + Drag:** Pan canvas
- ✅ **Ctrl/Cmd + Scroll:** Zoom canvas

#### **Node Interaction**
- ✅ **Click:** Select node
- ✅ **Double-click:** Drill down to child diagram
- ✅ **Right-click:** Open context menu
- ✅ **Delete Key:** Delete selected node/edge (if implemented)

#### **Property Panel**
- ✅ **Tab:** Move between form fields
- ✅ **Enter:** Submit inline edits
- ✅ **Esc:** Close panel

### Semantic HTML

All form elements use proper semantic HTML:
- ✅ `<label>` elements associated with inputs
- ✅ `<button>` elements for actions
- ✅ `<input>` elements with appropriate `type` attributes
- ✅ Native `<select>` for dropdowns

---

## ARIA Labels

### Interactive Elements

#### **Toolbar Buttons**
All toolbar buttons should have descriptive labels:

```typescript
// Example: Node creation button
<button
  aria-label="Add System node to diagram"
  title="Add System"
  onClick={handleAddSystem}
>
  <SystemIcon />
</button>
```

#### **Property Panel Close Button**
```typescript
<button
  aria-label="Close property panel"
  onClick={onClose}
>
  ✕
</button>
```

#### **Export Buttons**
```typescript
<button
  aria-label="Export diagram as PNG image"
  onClick={() => handleExport('png')}
>
  Export PNG
</button>
```

### Form Elements

#### **FormField Component**
Already uses proper label association:

```typescript
<label htmlFor={`field-${id}`}>
  {label}
</label>
<input
  id={`field-${id}`}
  value={value}
  onChange={onChange}
  aria-describedby={description ? `desc-${id}` : undefined}
/>
```

---

## Color Contrast

### Obsidian Theme Integration

BAC4 uses Obsidian's CSS variables which automatically adapt to user's theme:

- ✅ **Text Colors:** `var(--text-normal)`, `var(--text-muted)`, `var(--text-faint)`
- ✅ **Background Colors:** `var(--background-primary)`, `var(--background-secondary)`
- ✅ **Interactive Elements:** `var(--interactive-accent)`, `var(--interactive-hover)`

### WCAG Compliance

Obsidian's default themes meet WCAG 2.1 AA standards:
- **Normal text:** Minimum contrast ratio 4.5:1
- **Large text:** Minimum contrast ratio 3:1
- **UI components:** Minimum contrast ratio 3:1

### Custom Node Colors

Users can set custom node colors via ColorPicker:
- ⚠️ **Warning:** User-selected colors may not meet contrast requirements
- ✅ **Mitigation:** Default colors (presets) are WCAG-compliant
- 💡 **Future:** Add contrast checker to ColorPicker

---

## Focus Indicators

### Current Implementation

Focus indicators are provided by Obsidian's CSS:

```css
/* Obsidian provides these automatically */
button:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}

input:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: -2px;
}
```

### Custom Focus Styles

For canvas nodes (React Flow handles this):
```typescript
// React Flow provides focus styling
.react-flow__node:focus {
  outline: 2px solid var(--interactive-accent);
}
```

---

## Screen Reader Support

### Announced Elements

#### **Canvas State Changes**
Use `aria-live` regions for dynamic updates:

```typescript
// Future implementation
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```

Examples:
- "Node added: System 1"
- "Edge created between System 1 and System 2"
- "Diagram saved successfully"

#### **Property Panel Updates**
```typescript
<div
  role="region"
  aria-label="Node properties"
  aria-describedby="panel-description"
>
  <p id="panel-description" className="sr-only">
    Edit properties for selected node
  </p>
  {/* Panel content */}
</div>
```

### Alternative Text

#### **Node Icons**
```typescript
<div role="img" aria-label={`${nodeType} node`}>
  <NodeIcon />
</div>
```

#### **Breadcrumbs**
```typescript
<nav aria-label="Diagram hierarchy">
  <ol>
    {breadcrumbs.map((crumb) => (
      <li key={crumb.path}>
        <a href={crumb.path}>{crumb.label}</a>
      </li>
    ))}
  </ol>
</nav>
```

---

## Error Messages

### Accessible Error Reporting

Use `ErrorHandler` with proper ARIA attributes:

```typescript
// Current implementation uses Obsidian Notice
// Notices are automatically announced by screen readers

ErrorHandler.handleError(
  error,
  'Failed to save diagram. Please try again.'
);

// For form validation errors
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? 'error-message' : undefined}
/>
{hasError && (
  <div id="error-message" role="alert">
    {errorMessage}
  </div>
)}
```

---

## Keyboard Shortcuts

### Current Shortcuts

| Action | Shortcut | Notes |
|--------|----------|-------|
| Save | Cmd/Ctrl + S | Handled by Obsidian |
| Undo | Cmd/Ctrl + Z | React Flow built-in |
| Redo | Cmd/Ctrl + Shift + Z | React Flow built-in |
| Delete | Delete/Backspace | Delete selected node/edge |
| Select All | Cmd/Ctrl + A | React Flow built-in |
| Copy | Cmd/Ctrl + C | React Flow built-in |
| Paste | Cmd/Ctrl + V | React Flow built-in |
| Zoom In | Cmd/Ctrl + Plus | React Flow built-in |
| Zoom Out | Cmd/Ctrl + Minus | React Flow built-in |
| Fit View | Cmd/Ctrl + 0 | React Flow built-in |

### Future Shortcuts

| Action | Proposed Shortcut | Priority |
|--------|-------------------|----------|
| Add System Node | Cmd/Ctrl + 1 | Medium |
| Add Person Node | Cmd/Ctrl + 2 | Medium |
| Add Container Node | Cmd/Ctrl + 3 | Medium |
| Toggle Property Panel | Cmd/Ctrl + P | Low |
| Export PNG | Cmd/Ctrl + E | Low |

---

## Touch/Mobile Accessibility

### Current Support

React Flow provides basic touch support:
- ✅ Touch to select
- ✅ Pinch to zoom
- ✅ Two-finger drag to pan
- ✅ Long press for context menu

### Considerations

- ⚠️ Small touch targets (<44px) on toolbar buttons
- ⚠️ Difficult to create edges on touch devices
- 💡 **Future:** Increase button sizes for touch
- 💡 **Future:** Add touch-friendly edge creation mode

---

## Testing Checklist

### Manual Testing

- [ ] **Keyboard Navigation:** Tab through all interactive elements
- [ ] **Screen Reader:** Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] **High Contrast Mode:** Test in Windows High Contrast
- [ ] **Zoom:** Test at 200% browser zoom
- [ ] **Color Blindness:** Test with color blindness simulators
- [ ] **Touch:** Test on tablet if available

### Automated Testing

```bash
# Future: Add accessibility linting
npm install --save-dev eslint-plugin-jsx-a11y

# Add to .eslintrc
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ]
}
```

### Tools

- **axe DevTools:** Browser extension for accessibility auditing
- **WAVE:** Web accessibility evaluation tool
- **Lighthouse:** Chrome DevTools accessibility audit
- **Color Contrast Analyzer:** Desktop tool for contrast checking

---

## Known Limitations

### React Flow Canvas

- ⚠️ Canvas is primarily mouse/touch-driven
- ⚠️ Screen readers cannot navigate canvas nodes natively
- ⚠️ Keyboard-only users may struggle with complex diagrams

### Mitigations

1. **Diagram List View** (Future)
   - Text-based list of all nodes and connections
   - Fully keyboard navigable
   - Screen reader friendly

2. **Keyboard-First Mode** (Future)
   - Press `K` to enter keyboard mode
   - Arrow keys to navigate between nodes
   - Enter to edit, Space to connect

3. **Export to Accessible Formats** (Future)
   - Export diagram structure as structured text
   - Export as accessible SVG with proper ARIA labels

---

## Best Practices for Contributors

### When Adding New Features

1. **Always Add ARIA Labels**
   ```typescript
   <button aria-label="Descriptive action">
     <Icon />
   </button>
   ```

2. **Use Semantic HTML**
   ```typescript
   // ❌ Bad
   <div onClick={handleClick}>Click me</div>

   // ✅ Good
   <button onClick={handleClick}>Click me</button>
   ```

3. **Provide Keyboard Alternatives**
   ```typescript
   // Support both click and keyboard
   <div
     role="button"
     tabIndex={0}
     onClick={handleClick}
     onKeyPress={(e) => e.key === 'Enter' && handleClick()}
   >
     Action
   </div>
   ```

4. **Test with Keyboard Only**
   - Unplug your mouse
   - Tab through entire interface
   - Ensure all actions are reachable

5. **Add Focus Indicators**
   ```typescript
   // Never remove focus indicators
   // If you must customize, ensure visibility
   button:focus-visible {
     outline: 2px solid var(--interactive-accent);
   }
   ```

---

## Accessibility Roadmap

### Phase 4.3 (Current)
- ✅ Document current accessibility features
- ✅ Add ARIA labels to key components
- ✅ Ensure keyboard navigation works
- ✅ Document color contrast compliance

### Future Phases
- ⏳ Add automated accessibility testing
- ⏳ Implement keyboard-first navigation mode
- ⏳ Add diagram list view for screen readers
- ⏳ Improve touch target sizes
- ⏳ Add contrast checker to ColorPicker
- ⏳ Add keyboard shortcuts for common actions

---

## Resources

### Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Testing
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

---

## Conclusion

Phase 4.3 establishes accessibility as a core principle:
- ✅ Semantic HTML throughout
- ✅ Keyboard navigation supported
- ✅ WCAG-compliant color contrast (via Obsidian themes)
- ✅ Proper focus indicators
- ✅ Screen reader considerations documented

BAC4 Plugin follows Obsidian's accessibility standards and provides a foundation for future enhancements to support all users.

