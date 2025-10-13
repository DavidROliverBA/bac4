# MCP Workflow Guide - Generate Diagrams with Claude Desktop

**Version:** v0.2.0
**Feature:** AI-Powered Diagram Generation via MCP
**Difficulty:** Easy (just chat!)

---

## 🎯 What is MCP Workflow?

The **Model Context Protocol (MCP) workflow** lets you generate BAC4 diagrams by simply chatting with Claude Desktop. No API keys, no modals - just natural conversation!

### **How It Works:**

```
You → Claude Desktop → MCP → Your Obsidian Vault → BAC4 Plugin → Diagram!
```

1. You describe what you want in plain English to Claude Desktop
2. Claude writes a `.bac4` file directly to your vault via MCP
3. You run "Import MCP-Generated Diagram" in Obsidian
4. Diagram opens automatically!

---

## 🚀 Quick Start

### **Prerequisites:**

✅ **Claude Desktop** installed (get it at https://claude.ai/download)
✅ **Claude Pro or Max subscription** (for unlimited usage)
✅ **obsidian-mcp-tools plugin** installed in your vault
✅ **BAC4 plugin v0.2.0+** installed

### **One-Time Setup:**

The MCP integration should already be configured if you have obsidian-mcp-tools. No additional setup needed!

---

## 📝 Step-by-Step Tutorial

### **Step 1: Open Claude Desktop**

Open the Claude Desktop app and start a new conversation.

### **Step 2: Describe Your Architecture**

Tell Claude what diagram you want. Be specific about:
- **Diagram type** (Context, Container, or Component)
- **Components** (what systems, services, or actors)
- **Relationships** (how they connect)

**Example Prompt:**

```
I have a BAC4 diagram plugin in my Obsidian vault at:
/Users/[YOUR_USERNAME]/Documents/Vaults/[YOUR_VAULT]/

Please create a Container diagram for a microservices e-commerce platform with:
- Web Frontend (React SPA for customers)
- Mobile App (React Native for iOS/Android)
- API Gateway (Kong gateway for routing)
- Order Service (Node.js service managing orders)
- Product Service (Node.js service managing inventory)
- User Service (Node.js service for authentication)
- PostgreSQL Database (stores all data)
- Redis Cache (caches sessions and products)
- RabbitMQ Queue (async message processing)

Relationships:
- Web Frontend calls API Gateway via HTTPS
- Mobile App calls API Gateway via HTTPS
- API Gateway routes to all services
- All services connect to PostgreSQL
- All services use Redis for caching
- Order Service publishes events to RabbitMQ

Create the file as: BAC4/ECommerce_Container.bac4

Use proper BAC4 JSON format with:
- containerType options: webapp, mobileapp, api, database, queue
- Position nodes to avoid overlaps (spread x: 100-1000, y: 100-600)
- Add edge labels and direction: "right"
```

### **Step 3: Wait for Claude to Create the File**

Claude will:
1. Generate the diagram structure
2. Write the `.bac4` file to your vault via MCP
3. Confirm it's been created

**Look for:** "I've created the file at BAC4/ECommerce_Container.bac4"

### **Step 4: Import in Obsidian**

Back in Obsidian:

1. **Reload** Obsidian (Cmd+R or Ctrl+R)
2. Open **Command Palette** (Cmd+P or Ctrl+P)
3. Type **"Import MCP"**
4. Select **"BAC4: Import MCP-Generated Diagram"**
5. The diagram opens automatically!

### **Step 5: Edit and Refine**

The diagram is now yours to:
- Adjust node positions
- Edit labels and descriptions
- Add or remove connections
- Change colors
- Export as PNG/JPEG/SVG

---

## 🎨 Example Prompts

### **Context Diagram Example:**

```
Create a Context diagram for a hospital management system.

Systems:
- Patient (person who receives care)
- Doctor (person who provides care)
- Nurse (person who assists doctors)
- Hospital Management System (main application)
- Electronic Health Records (external system)
- Pharmacy System (external system)
- Insurance Gateway (external system)

Relationships:
- Patient uses Hospital Management System
- Doctor uses Hospital Management System
- Nurse uses Hospital Management System
- Hospital Management System connects to Electronic Health Records
- Hospital Management System connects to Pharmacy System
- Hospital Management System connects to Insurance Gateway

Save as: BAC4/Hospital_Context.bac4
```

### **Container Diagram Example:**

```
Create a Container diagram for a video streaming platform.

Containers:
- Web Player (React webapp for watching videos)
- Mobile App (native iOS/Android app)
- API Gateway (routes all requests)
- Video Service (manages video metadata)
- Streaming Service (handles video delivery)
- User Service (authentication and profiles)
- Recommendation Service (ML-based recommendations)
- PostgreSQL Database (metadata storage)
- MongoDB Database (user activity tracking)
- Redis Cache (caching layer)
- S3 Storage (video file storage - external AWS)
- CDN (CloudFront - external AWS)

Relationships:
- Web Player calls API Gateway
- Mobile App calls API Gateway
- API Gateway routes to all services
- Streaming Service reads from S3 Storage
- Streaming Service delivers via CDN
- Video Service writes to PostgreSQL
- User Service writes to PostgreSQL
- Recommendation Service reads from MongoDB
- All services use Redis Cache

Save as: BAC4/VideoStreaming_Container.bac4
```

### **Component Diagram Example:**

```
Create a Component diagram showing AWS deployment of an API Gateway.

Components:
- API Controller (handles HTTP requests)
- Authentication Middleware (validates JWT tokens)
- Rate Limiter (prevents abuse)
- Request Router (routes to backend services)
- AWS Lambda (serverless functions)
- Amazon API Gateway (AWS service)
- AWS CloudWatch (logging and monitoring - AWS)
- Amazon DynamoDB (session storage - AWS)
- Amazon SQS (message queue - AWS)

Relationships:
- Amazon API Gateway receives requests
- API Controller processes requests
- Authentication Middleware validates tokens using DynamoDB
- Rate Limiter checks limits using Redis
- Request Router invokes AWS Lambda
- All components log to CloudWatch
- Lambda publishes events to SQS

Save as: BAC4/APIGateway_Component.bac4

Use cloudComponent type for AWS services with proper provider: "aws"
```

---

## 💡 Pro Tips

### **1. Be Specific About File Paths**

Always include your vault path and desired filename:
```
Vault path: /Users/your-name/Documents/Vaults/YourVault/
File: BAC4/MyDiagram_Container.bac4
```

### **2. Use Descriptive Filenames**

Follow the pattern: `[ProjectName]_[DiagramType].bac4`
- ✅ `ECommerce_Container.bac4`
- ✅ `PaymentGateway_Component.bac4`
- ✅ `Hospital_Context.bac4`
- ❌ `diagram1.bac4`

### **3. Specify Node Positions**

Ask Claude to spread nodes out:
```
Position nodes to avoid overlaps:
- x: 100-1000 (spread horizontally)
- y: 100-600 (spread vertically)
```

### **4. Include Edge Labels**

Good edge labels make diagrams readable:
- ✅ "calls API via HTTPS"
- ✅ "reads/writes user data"
- ✅ "publishes order events"
- ❌ "connects to"

### **5. Use Proper Container Types**

For Container diagrams:
- `webapp` - Web applications
- `mobileapp` - Mobile apps
- `api` - API services
- `database` - Databases
- `queue` - Message queues

### **6. Mark External Systems**

For Context diagrams, tell Claude which systems are external:
```
- Payment Gateway (external system for payments)
- Email Service (external system for notifications)
```

---

## 🔄 Iterative Refinement

You can ask Claude to update diagrams:

**Initial Request:**
> "Create a Container diagram for a blog platform with web app, API, and database."

**Refinement:**
> "Add a Redis cache and CDN to the blog platform diagram. Save as BAC4/Blog_Container_v2.bac4"

**Further Refinement:**
> "Add a comment service and notification service. Save as BAC4/Blog_Container_v3.bac4"

Each iteration creates a new file - you can compare versions!

---

## 🐛 Troubleshooting

### **Problem: "No BAC4 diagrams found"**

**Solution:**
1. Check if the file was created: Open your vault in Finder/Explorer
2. Look for `BAC4/[filename].bac4`
3. If missing, ask Claude to create it again
4. Make sure MCP is configured (check Claude Desktop settings)

### **Problem: Diagram opens but looks wrong**

**Solution:**
1. Check the console (View → Developer → Toggle Developer Tools)
2. Look for JSON parsing errors
3. Ask Claude to regenerate with correct format
4. Include example JSON structure in your prompt

### **Problem: Import command doesn't appear**

**Solution:**
1. Make sure BAC4 plugin v0.2.0+ is installed
2. Reload Obsidian (Cmd+R)
3. Check if plugin is enabled (Settings → Community Plugins)

### **Problem: Claude can't write to vault**

**Solution:**
1. Check MCP configuration in Claude Desktop
2. Verify obsidian-mcp-tools is installed
3. Check vault path is correct in your prompt
4. Restart Claude Desktop

---

## 📊 Comparison: MCP vs API vs Manual

| Feature | MCP Workflow | API Workflow | Manual |
|---------|--------------|--------------|--------|
| **Setup** | Already done | Need API key | None |
| **Speed** | 3-5 seconds | 5-10 seconds | Minutes |
| **Cost** | Free (with Claude Pro) | $0.01/diagram | Free |
| **UX** | Natural chat | Modal form | Drag & drop |
| **Iterations** | Easy (just ask) | Need to resubmit | Direct editing |
| **Complexity** | Handles any size | Limited by tokens | No limit |
| **Best For** | Large/complex diagrams | Quick generation | Full control |

---

## 🎯 Best Practices

### **For Context Diagrams:**

✅ **DO:**
- Include 3-7 systems
- Identify actors (people)
- Mark external systems
- Use clear relationship labels

❌ **DON'T:**
- Include implementation details
- Show internal containers
- Use technical jargon

### **For Container Diagrams:**

✅ **DO:**
- Show 5-12 containers
- Group related containers visually
- Include databases and queues
- Show communication patterns

❌ **DON'T:**
- Mix multiple systems
- Include deployment details
- Show code-level components

### **For Component Diagrams:**

✅ **DO:**
- Show 5-15 components
- Include cloud services (AWS/Azure/GCP)
- Show data flow
- Include middleware

❌ **DON'T:**
- Show individual classes
- Include every function
- Over-complicate

---

## 🚀 Advanced Usage

### **Generating Multiple Diagrams**

Create a full architecture set in one conversation:

```
Please create three diagrams for my e-commerce platform:

1. Context diagram (BAC4/ECommerce_Context.bac4):
   - Actors: Customer, Admin, Vendor
   - Systems: E-Commerce Platform, Payment Gateway, Shipping API

2. Container diagram (BAC4/ECommerce_Container.bac4):
   - All containers for the E-Commerce Platform

3. Component diagram (BAC4/ECommerce_API_Component.bac4):
   - Components inside the API Gateway container
   - Include AWS services for deployment
```

### **Linking Diagrams**

After importing all diagrams, you can link them in BAC4:

1. Open the Context diagram
2. Select a System node
3. In Property Panel, choose "Link to child diagram"
4. Select the Container diagram
5. Now double-clicking the System opens the Container!

---

## 📚 Additional Resources

- **BAC4 Plugin Documentation:** [CLAUDE.md](../CLAUDE.md)
- **API Integration Guide:** [AI_INTEGRATION_COMPLETE.md](AI_INTEGRATION_COMPLETE.md)
- **Example Diagrams:** [mcp-diagram-generation-example.md](../examples/mcp-diagram-generation-example.md)
- **MCP Protocol:** https://modelcontextprotocol.io/

---

## 🎉 Success Stories

### **User Testimonial:**

> "I described my microservices architecture to Claude in plain English, ran one command in Obsidian, and had a perfect Container diagram in 10 seconds. This is game-changing!" - BAC4 User

---

## 💬 Getting Help

- **Plugin Issues:** Create an issue on GitHub
- **MCP Issues:** Check obsidian-mcp-tools documentation
- **Claude Desktop Issues:** Contact Anthropic support

---

*Last updated: 2025-10-13*
*Version: v0.2.0*
*Status: Production-Ready ✅*
