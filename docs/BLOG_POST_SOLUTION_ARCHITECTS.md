# Why Solution Architects Need BAC4 in Their Toolkit

**Published:** 2025-10-14
**Author:** David Oliver
**Target Audience:** Solution Architects, Enterprise Architects, Technical Leads

---

## The Architecture Documentation Problem We All Know Too Well

You've been there: It's 2 AM before a critical architecture review. You're frantically updating Visio diagrams that haven't been touched in six months. The AWS infrastructure changed three sprints ago, but the documentation still shows the old RDS setup. Your stakeholders need the Container diagram tomorrow, but you're stuck recreating it from memory because someone saved over the editable version with a flattened PDF.

Sound familiar?

As solution architects, we live in a constant tension between **designing systems** and **documenting systems**. The tools we use—Visio, draw.io, Lucidchart, PowerPoint—were built for general-purpose diagramming, not for the specific, evolving needs of modern cloud architecture management.

**What if there was a better way?**

---

## Introducing BAC4: Architecture Management That Actually Works

BAC4 (Business Architecture for C4) is not just another diagramming tool. It's a **purpose-built architecture management platform** designed specifically for solution architects working in cloud environments.

Built on the proven C4 model (Context, Container, Component), BAC4 transforms architecture documentation from a painful overhead task into a natural part of your workflow. And it does this from inside the tool you might already be using for everything else: **Obsidian**.

### What Makes BAC4 Different?

**Three Ways to Create Diagrams:**
1. **Manual Creation** - Drag & drop visual editor for precise control
2. **AI Generation** - Describe your architecture in plain English, get instant diagrams
3. **Conversational Design** - Chat with Claude Desktop to iteratively refine complex systems

**Git-Native Architecture:**
- Every diagram is a plain JSON file
- Full version control out of the box
- Diff-friendly format shows exactly what changed
- Works seamlessly with your existing Git workflows

**Cloud-First Design:**
- Built-in component libraries for AWS, Azure, GCP
- Drag & drop Lambda, S3, DynamoDB, API Gateway
- Automatic documentation generation
- Self-contained diagrams with embedded links

---

## What BAC4 Replaces (And Why You'll Want It To)

### ❌ **Visio/draw.io** → ✅ **BAC4**

**The Old Way:**
- Generic diagramming tools not built for cloud architecture
- Manual updates every time infrastructure changes
- No version control beyond "architecture_v2_final_FINAL.vsdx"
- Binary files that can't be diffed
- Expensive licenses or feature-limited free versions

**The BAC4 Way:**
- Cloud-specific component libraries built-in
- Hierarchical navigation (drill down from Context → Container → Component)
- Git-native with meaningful diffs
- Open-source, MIT licensed
- AI-powered generation for rapid iteration

**Why It Matters:**
When your CFO asks "Can you show me how our architecture evolved over the last six months?", you can run `git log` instead of desperately searching OneDrive for old versions.

---

### ❌ **Lucidchart/Miro** → ✅ **BAC4**

**The Old Way:**
- Cloud-hosted proprietary platforms
- Subscription per user adds up fast
- Export formats lose fidelity
- Limited offline access
- Not integrated with your knowledge base

**The BAC4 Way:**
- Runs locally in Obsidian (your architecture lives with your notes)
- No subscription fees (free forever)
- Export to PNG/JPEG/SVG anytime
- Full offline support
- Bi-directional links between diagrams and documentation

**Why It Matters:**
Your architecture documentation should live where your technical decisions, ADRs, and runbooks already live—in your knowledge base, not scattered across SaaS platforms.

---

### ❌ **PowerPoint Frankenstein Diagrams** → ✅ **BAC4**

**The Old Way:**
- Copy-paste AWS icons from Google Images
- Manual alignment of 47 different shapes
- One person has the "master copy" on their laptop
- Changes require starting over
- Presentation-focused, not architecture-focused

**The BAC4 Way:**
- Professional cloud component library out of the box
- Automatic layout and alignment
- Git-based collaboration (everyone has the source)
- Iterative refinement with AI assistance
- Architecture-first design (export to PowerPoint when you need to present)

**Why It Matters:**
Stop spending hours on pixel-perfect alignment. Focus on the architecture, not the aesthetics.

---

### ❌ **AWS Architecture Diagrams (CloudFormation Designer, etc.)** → ✅ **BAC4**

**The Old Way:**
- Vendor-specific tools lock you into one cloud
- Can't show multi-cloud or hybrid architectures
- Limited to infrastructure view (no business context)
- Disconnected from your broader documentation
- No support for conceptual/logical views

**The BAC4 Way:**
- Multi-cloud by design (AWS, Azure, GCP in one diagram)
- C4 model supports Context/Container/Component levels
- Integrated with your technical writing workflow
- Supports both planned and actual architecture
- Business context and technical details in one place

**Why It Matters:**
Real-world architectures aren't pure AWS or pure Azure. They're hybrid, multi-cloud, on-prem, and SaaS. Your diagrams should reflect that reality.

---

## The Five Game-Changing Benefits for Solution Architects

### 1. **Git-Native = True Architecture Version Control**

```bash
# See what changed in your architecture
git diff architecture/PaymentSystem.bac4

# Review architecture evolution over time
git log --all --oneline --graph architecture/

# Branch for experimental designs
git checkout -b spike/new-caching-layer

# Collaborate with pull requests
gh pr create --title "Architecture: Add event sourcing to orders service"
```

**Real Scenario:**
Your CTO asks: "When did we decide to add the Redis cache?" Instead of searching Slack, you run `git log` and find the exact commit, the reasoning in the commit message, and the architect who made the decision.

---

### 2. **AI-Powered Generation = 10x Faster Documentation**

**Traditional Approach:** 2-4 hours to create a Container diagram manually

**With BAC4:**
1. Open command palette
2. Select "Generate Container Diagram from Description"
3. Type: "E-commerce platform with React frontend, Node.js API, PostgreSQL database, Redis cache, and S3 for images"
4. Get a complete diagram in 5 seconds

**Even Better with Claude Desktop MCP:**
```
You: "Create a Container diagram for a serverless order processing system
with API Gateway, Lambda functions for validation and processing,
DynamoDB for orders, SQS for async tasks, and SNS for notifications"

Claude: *Creates and saves the diagram directly to your vault*

You: "Add a step function to orchestrate the order workflow"

Claude: *Updates the diagram with the orchestration layer*
```

**Real Scenario:**
During a client workshop, they describe their current architecture. Instead of frantically scribbling notes, you chat with Claude Desktop. By the time the meeting ends, you have a complete Container diagram ready for review.

---

### 3. **Hierarchical Navigation = No More Lost Context**

**The C4 Model in Action:**

```
Context Diagram (System Landscape)
    ↓ Double-click "Payment System"
Container Diagram (Applications & Services)
    ↓ Double-click "Payment API"
Component Diagram (Code Components + Cloud Services)
```

Every node knows its place in the hierarchy. Double-click to drill down. Click "Parent" to zoom out. Your architecture documentation becomes **explorable**, not just viewable.

**Real Scenario:**
Executive asks: "What services does our Payment System use?"
- Show Context: Here's where it fits in the overall landscape
- Drill to Container: Here are the applications and databases
- Drill to Component: Here's how it integrates with Stripe, PostgreSQL, and Redis

Three clicks. Complete story. No separate documents.

---

### 4. **Self-Contained Files = Collaboration Without Chaos**

**Traditional Problem:**
- "Can you send me the architecture diagram?"
- "Which version?"
- "The latest one"
- "The one from the email or the one on SharePoint?"
- "I don't know, the most recent?"
- *30 minutes later, still looking*

**BAC4 Solution:**
Every `.bac4` file is self-contained:
- Embedded metadata (version, type, timestamps)
- Embedded links (child diagrams, documentation)
- Plain JSON (readable, diffable, searchable)
- No external dependencies

```bash
# Share a diagram
git add architecture/PaymentSystem.bac4
git commit -m "Add Payment System architecture"
git push

# Teammate pulls it
git pull
# Opens in Obsidian automatically
```

**Real Scenario:**
New architect joins the team. They clone the repo, open Obsidian, and have **instant access** to the entire architecture knowledge base—diagrams, ADRs, runbooks, all linked together.

---

### 5. **Cloud Component Library = Professional Diagrams in Minutes**

No more:
- Googling "AWS Lambda icon PNG transparent"
- Manually resizing icons to match
- Wondering if that's the current AWS logo or the 2018 version
- Inconsistent styling across diagrams

**Built-In Libraries:**
- **AWS:** Lambda, S3, DynamoDB, RDS, API Gateway, SQS, SNS, CloudFront, Route 53, etc.
- **Azure:** Functions, Blob Storage, Cosmos DB, Service Bus, etc.
- **GCP:** Cloud Functions, Cloud Storage, Firestore, Pub/Sub, etc.
- **SaaS:** Stripe, Auth0, SendGrid, Twilio, etc.

Drag. Drop. Done.

**Real Scenario:**
Client says: "We want to migrate from AWS to Azure." You duplicate the Container diagram, swap AWS services for Azure equivalents from the component library, and have a comparison ready in 15 minutes.

---

## Real-World Use Cases

### Use Case 1: **Pre-Sales Architecture Proposals**

**Before BAC4:**
- Spend 4-6 hours creating diagrams in Visio
- Make last-minute changes the night before the pitch
- Export to PDF, hope the client can read the tiny text
- Create new diagrams from scratch for the next similar proposal

**With BAC4:**
1. Use previous proposal as template
2. Chat with Claude: "Adapt this for a healthcare client with HIPAA requirements"
3. Claude updates the diagram with compliant services (add encryption, audit logging, VPCs)
4. Export to high-res PNG for proposal deck
5. Save as reusable template for future healthcare proposals

**Time Saved:** 3-4 hours per proposal

---

### Use Case 2: **Architecture Review Preparation**

**Before BAC4:**
- Manually update diagrams based on recent changes
- Create three separate diagrams for Context, Container, Component views
- Copy-paste between tools to maintain consistency
- Print to PDF, distribute via email

**With BAC4:**
1. Review recent commits to see what changed
2. Update diagrams in place (hierarchical structure maintained)
3. Use AI to validate: "Review this architecture for security best practices"
4. Export all three levels (Context, Container, Component) to SVG
5. Share via Git, stakeholders open in Obsidian

**Time Saved:** 2-3 hours per review

---

### Use Case 3: **Onboarding New Team Members**

**Before BAC4:**
- Send 15 PowerPoint slides via email
- Schedule 2-hour walkthrough meeting
- Hope they remember half of it
- Repeat explanations every time something changes

**With BAC4:**
1. Share Obsidian vault (Git clone)
2. New member explores architecture hierarchically
3. Diagrams link to ADRs, runbooks, API docs
4. Self-service learning at their own pace
5. Ask questions via Git PR comments on specific diagrams

**Time Saved:** 1-2 hours per new team member + reduced meeting overhead

---

### Use Case 4: **Tracking Architecture Evolution**

**Before BAC4:**
- "I think we added that microservice in Q2... or was it Q3?"
- Manually create timeline diagrams
- No way to see what changed between versions

**With BAC4:**
```bash
# See architecture on specific date
git checkout $(git rev-list -n 1 --before="2024-06-01" main)

# Compare architectures between sprints
git diff sprint-24..sprint-25 architecture/

# Generate changelog
git log --oneline architecture/ --since="3 months ago"
```

**Benefit:** Complete audit trail for architecture decisions, compliance, and retrospectives.

---

## Who Should Use BAC4?

### ✅ **Perfect For:**

- **Solution Architects** managing 3+ cloud projects simultaneously
- **Enterprise Architects** maintaining system landscapes across business units
- **Technical Leads** who need to document and communicate designs quickly
- **Consulting Architects** creating proposals and architecture assessments
- **Cloud Architects** working with AWS, Azure, or GCP (or all three)
- **Staff Engineers** designing complex distributed systems

### ⚠️ **Not Ideal For:**

- **Network Engineers** (use specialized network diagramming tools)
- **UI/UX Designers** (use Figma, Sketch)
- **Process Modelers** (use BPMN-specific tools)
- **Teams Already Using Structurizr** and happy with it

---

## Getting Started with BAC4

### Step 1: Install Obsidian (If You Don't Already Have It)

[Download Obsidian](https://obsidian.md) - Free, available for Windows, macOS, Linux

### Step 2: Install BAC4 Plugin

**Option A: Community Plugins** (coming soon)
1. Open Obsidian Settings → Community Plugins
2. Search for "BAC4"
3. Install and enable

**Option B: Manual Install** (available now)
1. Download from [GitHub Releases](https://github.com/DavidROliverBA/bac4/releases/latest)
2. Extract to `.obsidian/plugins/bac4/`
3. Reload Obsidian, enable the plugin

### Step 3: Create Your First Diagram

**Try the AI Method:**
1. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
2. Type "BAC4: Generate Context Diagram from Description"
3. Describe your architecture
4. See the magic happen

**Or Go Manual:**
1. Press `Cmd+P` → "BAC4: Open Dashboard"
2. Drag nodes (System, Person) onto canvas
3. Connect with edges
4. Customize properties in the panel

### Step 4: Explore the Docs

- [Quick Start Guide](https://github.com/DavidROliverBA/bac4#-quick-start)
- [MCP Workflow (Claude Desktop Integration)](https://github.com/DavidROliverBA/bac4/blob/main/docs/MCP_WORKFLOW_GUIDE.md)
- [AI Integration Guide](https://github.com/DavidROliverBA/bac4/blob/main/docs/AI_INTEGRATION_COMPLETE.md)

---

## Pricing: Free. Forever.

**Cost Comparison:**

| Tool | Pricing | Annual Cost (5-person team) |
|------|---------|------------------------------|
| Lucidchart | $9-27/user/month | $540 - $1,620 |
| Visio | $15-30/user/month | $900 - $1,800 |
| draw.io | Free (limited features) | $0 |
| **BAC4** | **Free (MIT License)** | **$0** |

**Optional Costs:**
- Anthropic API for AI generation: ~$0.01 per diagram
- Claude Pro/Max for MCP workflow: $20/month (if you don't already have it)

**ROI:**
If BAC4 saves you 4 hours per month (conservative estimate), that's 48 hours/year. At a $150/hour architect rate, that's **$7,200 in value per year**.

---

## The Bottom Line: Architecture Documentation Shouldn't Be Painful

We became solution architects to **design systems**, not to fight with diagramming tools.

BAC4 gets out of your way and lets you focus on what matters:
- Designing robust, scalable architectures
- Communicating clearly with stakeholders
- Collaborating effectively with teams
- Evolving systems thoughtfully over time

**Three ways to create diagrams. Git-native version control. Cloud-first component library. AI-powered generation. All free.**

Stop spending nights updating Visio diagrams. Start spending that time on the architecture work you actually enjoy.

---

## Try BAC4 Today

**GitHub:** [https://github.com/DavidROliverBA/bac4](https://github.com/DavidROliverBA/bac4)

**Latest Release:** [v0.7.0](https://github.com/DavidROliverBA/bac4/releases/latest)

**Documentation:** [Full docs on GitHub](https://github.com/DavidROliverBA/bac4#readme)

**Questions?** Open an issue on GitHub or find me on the Obsidian Discord.

---

## About the Author

**David Oliver** is a solution architect and the creator of BAC4. After spending one too many nights updating architecture diagrams manually, he decided there had to be a better way. BAC4 is the result of that frustration—a tool built by architects, for architects.

*Built with the BMAD Method (Breakthrough Method of Agile AI-driven Development) in partnership with Claude Code.*

---

**Tags:** #SolutionArchitecture #CloudArchitecture #C4Model #EnterpriseArchitecture #AWS #Azure #GCP #Obsidian #KnowledgeManagement #ArchitectureDiagrams #TechnicalDocumentation

---

**Share this post:**
- [Twitter](#) | [LinkedIn](#) | [Reddit r/softwarearchitecture](#) | [Hacker News](#)

---

*Did BAC4 save you time? [Star the repo on GitHub](https://github.com/DavidROliverBA/bac4) and share your story!*
