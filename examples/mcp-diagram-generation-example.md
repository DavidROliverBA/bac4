# MCP Diagram Generation Example

This example demonstrates how BAC4 + MCP can generate C4 diagrams from natural language descriptions.

---

## Example 1: E-Commerce Platform

### User Input (Natural Language)
```
Create a Context diagram for an e-commerce platform.

The system has:
- Customers who browse and purchase products
- Administrators who manage inventory
- A core E-Commerce System
- An external Payment Gateway for processing transactions
- An external Shipping Service for delivery tracking

Relationships:
- Customers use the E-Commerce System to shop
- Administrators manage the E-Commerce System
- The E-Commerce System connects to Payment Gateway for payments
- The E-Commerce System connects to Shipping Service for tracking
```

### Generated .bac4 Diagram
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "person",
      "position": { "x": 200, "y": 100 },
      "data": {
        "label": "Customer",
        "description": "End users who browse and purchase products"
      }
    },
    {
      "id": "node-2",
      "type": "person",
      "position": { "x": 200, "y": 400 },
      "data": {
        "label": "Administrator",
        "description": "Users who manage inventory and system"
      }
    },
    {
      "id": "node-3",
      "type": "system",
      "position": { "x": 500, "y": 250 },
      "data": {
        "label": "E-Commerce System",
        "external": false,
        "description": "Core platform handling orders and inventory"
      }
    },
    {
      "id": "node-4",
      "type": "system",
      "position": { "x": 800, "y": 150 },
      "data": {
        "label": "Payment Gateway",
        "external": true,
        "description": "External service for payment processing"
      }
    },
    {
      "id": "node-5",
      "type": "system",
      "position": { "x": 800, "y": 350 },
      "data": {
        "label": "Shipping Service",
        "external": true,
        "description": "External service for delivery tracking"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-3",
      "type": "directional",
      "data": {
        "label": "uses",
        "direction": "right",
        "description": "Browse and purchase products"
      },
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#888888"
      }
    },
    {
      "id": "edge-2",
      "source": "node-2",
      "target": "node-3",
      "type": "directional",
      "data": {
        "label": "manages",
        "direction": "right",
        "description": "Manage inventory and orders"
      },
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#888888"
      }
    },
    {
      "id": "edge-3",
      "source": "node-3",
      "target": "node-4",
      "type": "directional",
      "data": {
        "label": "processes payments via",
        "direction": "right"
      },
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#888888"
      }
    },
    {
      "id": "edge-4",
      "source": "node-3",
      "target": "node-5",
      "type": "directional",
      "data": {
        "label": "tracks deliveries with",
        "direction": "right"
      },
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#888888"
      }
    }
  ]
}
```

### Visual Result
```
┌─────────┐                    ┌──────────────────┐
│Customer │────uses───────────>│ E-Commerce       │
└─────────┘                    │ System           │──>Payment Gateway
                               │                  │
┌──────────┐                   │                  │──>Shipping Service
│Admin     │────manages────────>└──────────────────┘
└──────────┘
```

---

## Example 2: Microservices Architecture

### User Input
```
Create a Container diagram for the E-Commerce System.

Containers:
- Web Frontend (React app for customers)
- Mobile App (iOS/Android for customers)
- API Gateway (routes requests)
- Order Service (manages orders)
- Product Service (manages inventory)
- User Service (authentication)
- PostgreSQL Database
- Redis Cache
- Message Queue (RabbitMQ)

Relationships:
- Web Frontend calls API Gateway
- Mobile App calls API Gateway
- API Gateway routes to Order Service
- API Gateway routes to Product Service
- API Gateway routes to User Service
- Order Service writes to Database
- Product Service writes to Database
- User Service writes to Database
- All services use Redis Cache
- Order Service publishes events to Message Queue
```

### Generated Result
Complete Container diagram with 9 containers and proper relationships, auto-positioned for clarity.

---

## Example 3: AWS Deployment

### User Input
```
Create a Component diagram showing how the API Gateway is deployed on AWS.

Components:
- API Controller (handles HTTP requests)
- Authentication Middleware
- Request Router
- AWS Lambda (serverless functions)
- Amazon API Gateway
- AWS CloudWatch (logging)
- Amazon DynamoDB (session storage)

The flow:
- API Controller receives requests through Amazon API Gateway
- Authentication Middleware validates tokens
- Request Router determines which Lambda to invoke
- Lambda functions execute business logic
- CloudWatch logs all activity
- DynamoDB stores session data
```

### Generated Result
Component diagram with AWS cloud services from the BAC4 component library, showing proper integration patterns.

---

## Example 4: Architecture Query

### User Query
```
"Which systems connect to external payment services?"
```

### MCP Response
```markdown
## Systems with Payment Integrations

### Context Level
1. **E-Commerce System**
   - Connects to: Payment Gateway (external)
   - Relationship: "processes payments via"
   - File: `BAC4/Context.bac4`

### Container Level
2. **Order Service**
   - Connects to: Stripe API (external)
   - Relationship: "charges customers via"
   - File: `BAC4/Container_1.bac4`

3. **Subscription Service**
   - Connects to: PayPal API (external)
   - Relationship: "handles recurring billing via"
   - File: `BAC4/Container_2.bac4`

### Summary
- 3 systems/containers integrate with payment services
- 2 external payment providers: Payment Gateway, Stripe, PayPal
- Primary payment flow: E-Commerce → Payment Gateway → Stripe
```

---

## Example 5: Documentation Generation

### User Command
```
"Generate architecture documentation for all diagrams"
```

### Generated Documentation
```markdown
# E-Commerce Platform - Architecture Documentation
*Generated from BAC4 diagrams on 2025-10-13*

## Table of Contents
1. [System Context](#system-context)
2. [Container Architecture](#container-architecture)
3. [Component Details](#component-details)
4. [External Dependencies](#external-dependencies)
5. [Technology Stack](#technology-stack)

## System Context

The E-Commerce Platform consists of a single core system that integrates with two external services.

### Systems
**E-Commerce System** (Core)
- Purpose: Central platform for online shopping
- Users: Customers, Administrators
- External Dependencies: Payment Gateway, Shipping Service

**Payment Gateway** (External)
- Provider: [To be determined]
- Purpose: Process credit card transactions
- Integration: REST API

**Shipping Service** (External)
- Provider: [To be determined]
- Purpose: Track deliveries and manage logistics
- Integration: REST API

### User Roles
**Customer**
- Browse product catalog
- Place orders
- Track deliveries

**Administrator**
- Manage inventory
- Process refunds
- Monitor system health

## Container Architecture

The E-Commerce System is decomposed into 9 containers following microservices architecture:

### Frontend Containers
1. **Web Frontend** (React SPA)
   - Technology: React 18, TypeScript
   - Deployment: S3 + CloudFront
   - Purpose: Customer-facing web interface

2. **Mobile App** (Native)
   - Technology: React Native
   - Platforms: iOS, Android
   - Purpose: Customer mobile experience

### Backend Containers
3. **API Gateway** (Kong)
   - Technology: Kong Gateway
   - Purpose: Request routing, authentication
   - Deployment: ECS Fargate

4. **Order Service** (Microservice)
   - Technology: Node.js, Express
   - Database: PostgreSQL
   - Cache: Redis
   - Queue: RabbitMQ
   - Purpose: Order lifecycle management

[... continues with all containers ...]

## External Dependencies

### Third-Party Services
- **Payment Gateway**: Credit card processing
- **Shipping Service**: Logistics and tracking
- **CloudWatch**: Monitoring and logging
- **SendGrid**: Transactional emails

### AWS Services
- Lambda: Serverless compute
- DynamoDB: Session storage
- S3: Static assets
- CloudFront: CDN
- RDS PostgreSQL: Relational data
- ElastiCache Redis: Caching

## Technology Stack

**Frontend**
- React 18, TypeScript
- React Native for mobile

**Backend**
- Node.js 18
- Express
- TypeScript

**Databases**
- PostgreSQL 14 (primary)
- Redis 7 (cache)
- DynamoDB (sessions)

**Infrastructure**
- AWS ECS Fargate
- AWS Lambda
- Kong Gateway
- RabbitMQ

**Monitoring**
- AWS CloudWatch
- Custom metrics dashboard

---
*This document was automatically generated from BAC4 diagrams.*
*Last updated: 2025-10-13*
```

---

## Implementation Example

### Command Registration
```typescript
// In main.ts
this.addCommand({
  id: 'generate-diagram-from-description',
  name: 'Generate Diagram from Description',
  callback: async () => {
    const description = await new DescriptionModal(this.app).prompt();

    const mcpService = new MCPService(this);
    if (!await mcpService.isAvailable()) {
      new Notice('MCP server not available');
      return;
    }

    const diagramData = await mcpService.generateDiagram(description, 'context');

    // Create new .bac4 file
    const fileName = `Generated_${Date.now()}.bac4`;
    await this.app.vault.create(
      `BAC4/${fileName}`,
      JSON.stringify(diagramData, null, 2)
    );

    new Notice(`Created ${fileName}`);
    await this.openCanvasView(`BAC4/${fileName}`);
  }
});
```

---

## Benefits Demonstrated

✅ **10x Faster Diagram Creation**: Describe instead of draw
✅ **Consistent Structure**: AI follows C4 model patterns
✅ **Rich Relationships**: Auto-generates meaningful edge labels
✅ **Intelligent Positioning**: Smart node placement algorithms
✅ **Cross-Diagram Analysis**: Query entire architecture
✅ **Living Documentation**: Auto-generated, always up-to-date

---

## Try It Yourself

Once v0.2.0 is released:

1. Install BAC4 plugin
2. Install MCP Tools plugin (if not already installed)
3. Open command palette: `Cmd+P`
4. Run: `BAC4: Generate Diagram from Description`
5. Describe your architecture
6. Watch the magic happen!

---

**Next:** See `docs/MCP_INTEGRATION_PLAN.md` for full implementation details.
