# Repository Rename: bac4 → BAC4

This guide covers renaming the repository to align with the BAC4 brand name.

## 🎯 Recommended Naming Convention

### Option 1: Mixed Case (RECOMMENDED)
- **Repository Name:** `BAC4` ✅
- **Plugin ID:** `bac4` (lowercase, follows Obsidian convention)
- **Display Name:** "BAC4 - Cloud Architecture Management"

**Pros:**
- Repository name matches brand (BAC4)
- Plugin ID follows Obsidian lowercase convention
- Clear distinction between brand name and technical ID

**Examples of this pattern:**
- Repository: `obsidian-git` → ID: `obsidian-git`
- Repository: `Templater` → ID: `templater`
- Repository: `QuickAdd` → ID: `quickadd`

### Option 2: All Lowercase
- **Repository Name:** `bac4`
- **Plugin ID:** `bac4`
- **Display Name:** "BAC4 - Cloud Architecture Management"

**Pros:**
- Perfect match between repo and ID
- Simpler, less confusion

**Cons:**
- Loses brand capitalization in repo name

---

## ✅ I RECOMMEND: Option 1 (Mixed Case)

**Reasoning:**
- GitHub repository name showcases your brand properly ("BAC4")
- Plugin ID follows Obsidian's lowercase convention
- Users see "BAC4" in repo URLs, "bac4" in folder names (standard practice)

---

## 📋 Files to Update

### 1. manifest.json
```json
{
  "id": "bac4",  // Changed from "bac4"
  "name": "BAC4 - Cloud Architecture Management",  // Keep as-is
  ...
}
```

### 2. package.json
```json
{
  "name": "bac4",  // Changed from "bac4"
  ...
}
```

### 3. Documentation Updates

**Files to update:**
- README.md
- SUBMISSION_SUMMARY.md
- docs/COMMUNITY_PLUGIN_SUBMISSION.md
- docs/*.md (all docs)
- CLAUDE.md

**Find and replace:**
- `bac4` → `bac4` (in technical contexts)
- `github.com/DavidROliverBA/bac4` → `github.com/DavidROliverBA/BAC4`
- `.obsidian/plugins/bac4/` → `.obsidian/plugins/bac4/`

### 4. GitHub Actions Workflows

**Files:**
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

**Changes:**
- Update zip filename: `bac4-*.zip` → `bac4-*.zip`

### 5. Version Bump Scripts

**Files:**
- `version-bump.mjs`

**Changes:**
- No changes needed (uses manifest.json values)

---

## 🔧 Step-by-Step Rename Process

### Phase 1: Update Local Files

#### Step 1: Update manifest.json
```bash
# Edit manifest.json
# Change "id": "bac4" → "id": "bac4"
```

#### Step 2: Update package.json
```bash
# Edit package.json
# Change "name": "bac4" → "name": "bac4"
```

#### Step 3: Update All Documentation
```bash
# Find all occurrences (for review)
grep -r "bac4" . --exclude-dir=node_modules --exclude-dir=.git

# Replace in all markdown files
find . -name "*.md" -type f -exec sed -i '' 's/bac4/bac4/g' {} +

# Replace GitHub URLs
find . -name "*.md" -type f -exec sed -i '' 's|DavidROliverBA/bac4|DavidROliverBA/BAC4|g' {} +

# Replace installation paths
find . -name "*.md" -type f -exec sed -i '' 's|\.obsidian/plugins/bac4/|.obsidian/plugins/bac4/|g' {} +
```

#### Step 4: Update GitHub Actions
```bash
# Edit .github/workflows/release.yml
# Line 21: bac4-${{ github.ref_name }}.zip → bac4-${{ github.ref_name }}.zip
# Line 70: bac4-${{ github.ref_name }}.zip → bac4-${{ github.ref_name }}.zip
# Line 71: bac4-${{ github.ref_name }}.zip → bac4-${{ github.ref_name }}.zip
```

#### Step 5: Update CLAUDE.md
```bash
# Edit CLAUDE.md
# Replace all references to bac4 with bac4
# Update repository URLs
```

#### Step 6: Test Build
```bash
npm run build
npm run typecheck
npm test
```

#### Step 7: Commit Changes
```bash
git add .
git commit -m "Rename plugin from bac4 to bac4 for brand alignment"
git push origin main
```

---

### Phase 2: Rename GitHub Repository

#### Step 1: Backup Your Work
```bash
# Ensure all changes are pushed
git push origin main

# Create a backup branch
git checkout -b pre-rename-backup
git push origin pre-rename-backup
git checkout main
```

#### Step 2: Rename on GitHub

1. Go to: https://github.com/DavidROliverBA/bac4
2. Click **Settings** tab
3. Scroll to **Repository name**
4. Change `bac4` to `BAC4`
5. Click **Rename**

⚠️ **GitHub will automatically:**
- Redirect `bac4` → `BAC4` (for a while)
- Update all open PRs and issues
- **NOT** update your local clone automatically

#### Step 3: Update Local Repository Remote

```bash
# Check current remote
git remote -v
# origin  https://github.com/DavidROliverBA/bac4.git (fetch)
# origin  https://github.com/DavidROliverBA/bac4.git (push)

# Update remote URL
git remote set-url origin https://github.com/DavidROliverBA/BAC4.git

# Verify
git remote -v
# origin  https://github.com/DavidROliverBA/BAC4.git (fetch)
# origin  https://github.com/DavidROliverBA/BAC4.git (push)

# Test connection
git fetch origin
git pull origin main
```

---

### Phase 3: Update Test Vaults

Your test vault installations also need updating:

#### Option A: Symlink Approach
```bash
# Remove old symlinks
rm -rf /Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4
rm -rf /Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4

# Create new symlinks with correct name
ln -s /Users/david.oliver/Documents/GitHub/BAC4 \
      /Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4

ln -s /Users/david.oliver/Documents/GitHub/BAC4 \
      /Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4
```

#### Option B: Manual Copy
```bash
# Remove old folders
rm -rf /Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4
rm -rf /Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4

# Create new folders
mkdir -p /Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4
mkdir -p /Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4

# Copy files
cp /Users/david.oliver/Documents/GitHub/BAC4/main.js \
   /Users/david.oliver/Documents/GitHub/BAC4/manifest.json \
   /Users/david.oliver/Documents/Vaults/BAC4Testv09/.obsidian/plugins/bac4/

cp /Users/david.oliver/Documents/GitHub/BAC4/main.js \
   /Users/david.oliver/Documents/GitHub/BAC4/manifest.json \
   /Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/bac4/
```

---

### Phase 4: Update Obsidian Plugin Registry Entry

When you submit to community plugins, use:

```json
{
  "id": "bac4",
  "name": "BAC4 - Cloud Architecture Management",
  "author": "David Oliver",
  "description": "AI-native cloud architecture management with C4 model diagrams. Self-contained .bac4 files with embedded links. Create diagrams manually, via AI API, or chat with Claude Desktop via MCP. AWS/Azure/GCP component libraries included.",
  "repo": "DavidROliverBA/BAC4"
}
```

Note: `"repo": "DavidROliverBA/BAC4"` (new repository name)

---

## 🧪 Testing Checklist

After renaming, verify:

### Build & Deploy
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm test` all tests pass
- [ ] No references to "bac4" in code

### Git Operations
- [ ] `git remote -v` shows new URL
- [ ] `git push` works
- [ ] `git pull` works
- [ ] GitHub repository page loads at new URL

### Obsidian Integration
- [ ] Plugin loads in Obsidian
- [ ] All commands work
- [ ] Canvas opens and functions
- [ ] Settings save correctly
- [ ] File operations work

### Documentation
- [ ] README renders correctly on GitHub
- [ ] All links work (no 404s)
- [ ] Installation instructions accurate

---

## 🔄 Migration Guide for Existing Users

If anyone already installed your plugin from GitHub (BRAT or manual):

### For BRAT Users
```
1. Remove old plugin: Settings → Community Plugins → BAC4 → Uninstall
2. Update BRAT: Remove "DavidROliverBA/bac4"
3. Add new: "DavidROliverBA/BAC4"
4. Reinstall via BRAT
```

### For Manual Install Users
```
1. Delete old folder: .obsidian/plugins/bac4/
2. Create new folder: .obsidian/plugins/bac4/
3. Download latest release from github.com/DavidROliverBA/BAC4
4. Extract to .obsidian/plugins/bac4/
5. Enable in Obsidian settings
```

### Data Migration
⚠️ **IMPORTANT:** Existing .bac4 diagram files are NOT affected by plugin rename!

User diagrams remain intact. Only the plugin folder name changes.

---

## 📝 Checklist Summary

### Pre-Rename
- [ ] All changes committed and pushed
- [ ] Backup branch created
- [ ] Build succeeds locally

### Update Files
- [ ] manifest.json → `"id": "bac4"`
- [ ] package.json → `"name": "bac4"`
- [ ] All .md files updated
- [ ] GitHub Actions updated
- [ ] CLAUDE.md updated
- [ ] Build tested
- [ ] Committed and pushed

### Rename Repository
- [ ] GitHub repository renamed to "BAC4"
- [ ] Local remote URL updated
- [ ] Git operations tested

### Update Deployments
- [ ] Test vault symlinks updated
- [ ] Plugin loads in Obsidian
- [ ] All features tested

### Documentation
- [ ] README accurate
- [ ] Installation guide updated
- [ ] Links all work

---

## 🚨 Common Issues & Solutions

### Issue: Git push fails after rename
```bash
# Solution: Update remote URL
git remote set-url origin https://github.com/DavidROliverBA/BAC4.git
```

### Issue: Plugin doesn't load in Obsidian
```bash
# Solution: Check folder name
# Should be: .obsidian/plugins/bac4/ (not bac4)
# Manifest ID must match folder name
```

### Issue: GitHub Actions fail
```bash
# Solution: Wait 5 minutes after rename
# GitHub redirect may take time to propagate
# Or update workflow files to use new repo name
```

### Issue: Old releases still reference bac4
```bash
# Solution: Create new release after rename
# Old releases are fine - they redirect automatically
# New releases will use correct naming
```

---

## 🎯 Quick Command Reference

```bash
# 1. Update manifest and package.json (manual edit)

# 2. Update all documentation
find . -name "*.md" -type f -exec sed -i '' 's/bac4/bac4/g' {} +
find . -name "*.md" -type f -exec sed -i '' 's|DavidROliverBA/bac4|DavidROliverBA/BAC4|g' {} +

# 3. Test and commit
npm run build && npm run typecheck && npm test
git add .
git commit -m "Rename plugin from bac4 to bac4"
git push origin main

# 4. Rename on GitHub (via web UI)

# 5. Update local remote
git remote set-url origin https://github.com/DavidROliverBA/BAC4.git
git fetch origin

# 6. Update test vaults
rm -rf /path/to/vault/.obsidian/plugins/bac4
ln -s /Users/david.oliver/Documents/GitHub/BAC4 \
      /path/to/vault/.obsidian/plugins/bac4

# 7. Reload Obsidian and test
```

---

## ✅ Success Criteria

You've successfully renamed when:
- ✅ Repository URL is `github.com/DavidROliverBA/BAC4`
- ✅ manifest.json has `"id": "bac4"`
- ✅ Plugin loads in `.obsidian/plugins/bac4/` folder
- ✅ All commands and features work
- ✅ Documentation reflects new naming
- ✅ Git operations work with new remote URL

---

**Ready to proceed?** Let me know and I'll execute all the file updates for you!
