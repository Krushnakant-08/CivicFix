import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI configuration — Phase 8.5
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CivicFix API',
      version: '1.0.0',
      description: `
## CivicFix — Civic Issue Tracker API

A production-grade REST API powering the CivicFix platform.

### Features
- **JWT Authentication** — Secure token-based auth
- **Report Management** — Full CRUD with AI analysis
- **Real-Time Notifications** — Socket.io powered
- **Blockchain Audit Trail** — Immutable SHA-256 hash chain
- **Analytics & Predictions** — Hotspot forecasting
- **Role-Based Access** — citizen / department / admin

### Authentication
Include the JWT token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`
      `,
      contact: {
        name: 'CivicFix Support',
        email: 'support@civicfix.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://civicfix-api.railway.app',
        description: 'Production server (Railway)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        // ─── Report ──────────────────────────────────────────
        Report: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            trackingId: { type: 'string', example: 'CF-2024-000123' },
            title: { type: 'string', example: 'Pothole on Main Street' },
            description: { type: 'string', example: 'Large pothole causing traffic hazard' },
            category: {
              type: 'string',
              enum: ['roads', 'sanitation', 'water', 'electricity', 'parks', 'traffic', 'other'],
            },
            status: {
              type: 'string',
              enum: ['reported', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'],
            },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            severity: { type: 'integer', minimum: 1, maximum: 10 },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
            upvotes: { type: 'integer', example: 5 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── User ────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Jane Citizen' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['citizen', 'department', 'admin'] },
            department: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Auth Responses ──────────────────────────────────
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // ─── Notification ────────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── AuditLog ────────────────────────────────────────
        AuditLog: {
          type: 'object',
          properties: {
            blockIndex: { type: 'integer' },
            reportId: { type: 'string' },
            action: { type: 'string' },
            actor: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                role: { type: 'string' },
              },
            },
            hash: { type: 'string', description: 'SHA-256 hash of this block' },
            previousHash: { type: 'string', description: 'Hash of the previous block' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Error ───────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Unauthorized' },
          },
        },
        // ─── Pagination ──────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Reports', description: 'Civic report management' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Notifications', description: 'Real-time notification management' },
      { name: 'Analytics', description: 'Analytics and predictions (Admin)' },
      { name: 'Audit', description: 'Blockchain audit trail (Admin)' },
      { name: 'Health', description: 'System health checks' },
    ],
  },
  // Scan route files for JSDoc @swagger annotations
  apis: ['./routes/*.js', './index.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
