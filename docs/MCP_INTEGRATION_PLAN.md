# BAC4 + MCP Integration Plan

**Status:** Proof of Concept
**Target Version:** v0.2.0
**MCP Server:** obsidian-mcp-tools (already installed in TestVault)

---

## Current State

### Detected MCP Configuration
```json
{
  "mcpServers": {
    "obsidian-mcp-tools": {
      "command": "Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/mcp-tools/bin/mcp-server",
      "env": {
        "OBSIDIAN_API_KEY": "2fd3977babd0e85546e9f6d209ba8393ae8ab8b1f6b8957d5630ea2bbd71a7da"
      }
    }
  }
}
```

### BAC4 Diagrams in Vault
- `BAC4/Context.bac4` - System landscape
- `BAC4/Container_1.bac4` - System 1 containers
- `BAC4/Container_2.bac4` - System 2 containers
- `BAC4/System_1.bac4` - System 1 detail
- `BAC4/System_2.bac4` - System 2 detail

---

## Integration Possibilities

### 1. AI-Assisted Diagram Generation

**Use Case:** Generate C4 diagrams from natural language descriptions

**User Workflow:**
1. User writes architecture description in markdown
2. User runs command: "BAC4: Generate Diagram from Description"
3. MCP sends description to Claude
4. Claude analyzes and generates .bac4 JSON
5. BAC4 plugin creates diagram file

**Example Prompt:**
```
Create a Context diagram for an e-commerce platform with:
- Web Store (external system)
- Payment Gateway (external system)
- Customer (person)
- Admin (person)
- Core System (main system)
```

**Expected Output:**
```json
{
  "nodes": [
    { "id": "node-1", "type": "person", "data": { "label": "Customer" }, ... },
    { "id": "node-2", "type": "person", "data": { "label": "Admin" }, ... },
    { "id": "node-3", "type": "system", "data": { "label": "Core System", "external": false }, ... },
    { "id": "node-4", "type": "system", "data": { "label": "Web Store", "external": true }, ... },
    { "id": "node-5", "type": "system", "data": { "label": "Payment Gateway", "external": true }, ... }
  ],
  "edges": [
    { "source": "node-1", "target": "node-3", "data": { "label": "uses" }, ... },
    { "source": "node-2", "target": "node-3", "data": { "label": "manages" }, ... }
  ]
}
```

---

### 2. Semantic Search Across Diagrams

**Use Case:** Find architectural components using natural language

**User Queries:**
- "Show me all systems that depend on the database"
- "Which containers handle payments?"
- "What external systems does our API connect to?"

**Implementation:**
- MCP server reads all .bac4 files
- Claude analyzes diagram structure
- Returns relevant components with relationships

---

### 3. Architecture Documentation Generation

**Use Case:** Generate markdown docs from diagrams

**User Workflow:**
1. User runs: "BAC4: Generate Architecture Document"
2. MCP reads all .bac4 diagrams
3. Claude generates comprehensive markdown doc
4. Document includes:
   - System overview
   - Container breakdown
   - Component details
   - Relationships and dependencies

**Example Output:**
```markdown
# E-Commerce Platform Architecture

## System Context
The platform consists of 3 main systems:
- **Core System**: Central processing system
- **Payment Gateway** (external): Handles transactions
- **Web Store** (external): Customer-facing interface

## Actors
- **Customer**: End users making purchases
- **Admin**: System administrators

## System Relationships
- Customer → uses → Core System
- Admin → manages → Core System
- Core System → integrates → Payment Gateway
```

---

### 4. Diagram Validation & Suggestions

**Use Case:** AI reviews diagrams for best practices

**Checks:**
- Are external systems properly marked?
- Do all systems have descriptions?
- Are relationships clearly labeled?
- Is the hierarchy consistent (Context → Container → Component)?

**Example Suggestions:**
```
⚠️ System "Payment API" is not marked as external but connects to external system
💡 Consider adding description to "Database" container
✅ All Context-level systems have Container diagrams
```

---

### 5. Auto-Population from Code

**Use Case:** Generate Component diagrams from codebase analysis

**User Workflow:**
1. User selects a Container diagram
2. User runs: "BAC4: Generate Components from Code"
3. MCP reads source code files
4. Claude identifies:
   - Controllers
   - Services
   - Repositories
   - External dependencies (AWS services)
5. BAC4 creates Component diagram with cloud components

---

## Technical Implementation

### Phase 1: Basic MCP Communication (v0.2.0)

**New Files:**
- `src/services/mcp-service.ts` - MCP communication layer
- `src/commands/mcp-commands.ts` - MCP-powered commands

**Commands to Add:**
1. `BAC4: Generate Diagram from Description`
2. `BAC4: Search Architecture`
3. `BAC4: Generate Documentation`

**MCP Service Interface:**
```typescript
export class MCPService {
  constructor(private plugin: BAC4Plugin) {}

  /**
   * Check if MCP server is available
   */
  async isAvailable(): Promise<boolean> {
    // Check if obsidian-mcp-tools is running
  }

  /**
   * Send diagram generation request
   */
  async generateDiagram(
    description: string,
    diagramType: 'context' | 'container' | 'component'
  ): Promise<{ nodes: Node[]; edges: Edge[] }> {
    // Send to MCP, get generated diagram data
  }

  /**
   * Search across all diagrams
   */
  async searchDiagrams(query: string): Promise<DiagramSearchResult[]> {
    // MCP reads all .bac4 files, returns matches
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(diagramPaths: string[]): Promise<string> {
    // MCP reads diagrams, Claude generates markdown
  }
}
```

---

### Phase 2: Advanced Features (v0.3.0)

**Features:**
- Real-time validation during editing
- Auto-suggestions while creating diagrams
- Code-to-diagram synchronization
- Diff detection (planned vs actual architecture)

---

## User Experience

### New UI Elements

**1. MCP Status Indicator**
```
Toolbar: [🤖 AI Assistant: Connected]
```

**2. AI Assistant Panel**
```
┌─────────────────────────────────┐
│ 🤖 BAC4 AI Assistant            │
├─────────────────────────────────┤
│ Describe your architecture:     │
│ ┌─────────────────────────────┐ │
│ │ A web app with API backend  │ │
│ │ that connects to PostgreSQL │ │
│ │ and Redis cache...          │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Generate Context Diagram]       │
│ [Generate Container Diagram]     │
└─────────────────────────────────┘
```

**3. Search Dialog**
```
┌─────────────────────────────────┐
│ 🔍 Search Architecture          │
├─────────────────────────────────┤
│ Query: "systems using database" │
│                                  │
│ Results:                         │
│ ✓ Core System → Database         │
│ ✓ Analytics System → Database    │
│ ✓ Reporting Service → Database   │
│                                  │
│ [Open Diagram] [Show Details]    │
└─────────────────────────────────┘
```

---

## Configuration

**Settings Tab Addition:**
```typescript
// BAC4 Settings
{
  mcp: {
    enabled: boolean;           // Enable MCP features
    serverPath: string;         // Path to MCP server binary
    apiKey: string;             // API key for authentication
    autoValidate: boolean;      // Real-time validation
    autoSuggest: boolean;       // AI suggestions while editing
  }
}
```

---

## Testing Plan

### Test 1: MCP Connection
```bash
# Verify MCP server is running
ps aux | grep mcp-server

# Test basic communication
curl -X POST http://localhost:3000/mcp/ping
```

### Test 2: Diagram Generation
```
Input: "Create a Context diagram with User, Admin, and API System"
Expected: Valid .bac4 file with 3 nodes
```

### Test 3: Search Functionality
```
Query: "Show me all external systems"
Expected: List of all nodes with external: true
```

---

## Benefits

### For Users
✅ Faster diagram creation (describe instead of draw)
✅ Consistent architecture documentation
✅ Easy discovery of components and relationships
✅ AI-powered validation and suggestions

### For Teams
✅ Standardized architecture representation
✅ Automatic documentation generation
✅ Easier onboarding (AI explains architecture)
✅ Drift detection (planned vs actual)

---

## Risks & Mitigations

### Risk 1: MCP Server Not Running
**Mitigation:** Graceful degradation - plugin works without MCP, AI features disabled

### Risk 2: Invalid AI-Generated Diagrams
**Mitigation:** Validation layer ensures generated diagrams match BAC4 schema

### Risk 3: API Key Security
**Mitigation:** Store encrypted in Obsidian's secure storage, never log or expose

---

## Next Steps

1. ✅ Verify MCP server is accessible
2. ⏳ Create `MCPService` class
3. ⏳ Implement "Generate Diagram" command
4. ⏳ Test with sample descriptions
5. ⏳ Add UI elements
6. ⏳ Document MCP features in user guide

---

## Resources

- **MCP Tools Plugin:** `/Users/david.oliver/Documents/Vaults/TestVault/.obsidian/plugins/mcp-tools/`
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Anthropic MCP Docs:** https://docs.anthropic.com/claude/docs/model-context-protocol
- **obsidian-mcp-tools GitHub:** https://github.com/jacksteamdev/obsidian-mcp-tools

---

**Status:** Ready for v0.2.0 development
**Estimated Effort:** 8-12 hours
**Priority:** High - Differentiating feature
