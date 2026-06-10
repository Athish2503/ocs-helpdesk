import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

const openApiSpecification = {
  openapi: "3.0.0",
  info: {
    title: "OCS Helpdesk API",
    version: "1.0.0",
    description: "Sprint 1 Authentication Foundation API Documentation",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Development Server",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "API Health Check",
        tags: ["System"],
        responses: {
          200: {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "API running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register a new customer",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "customer@example.com",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    example: "Password123!",
                  },
                  name: {
                    type: "string",
                    example: "Jane Doe",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "cm0..." },
                            name: { type: "string", example: "Jane Doe" },
                            email: { type: "string", example: "customer@example.com" },
                            role: { type: "string", example: "CUSTOMER" },
                            isActive: { type: "boolean", example: true },
                            emailVerified: { type: "boolean", example: false },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or email already in use",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Authenticate user and issue tokens",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "customer@example.com",
                  },
                  password: {
                    type: "string",
                    example: "Password123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "cm0..." },
                            name: { type: "string", example: "Jane Doe" },
                            email: { type: "string", example: "customer@example.com" },
                            role: { type: "string", example: "CUSTOMER" },
                          },
                        },
                        accessToken: { type: "string", example: "eyJhbG..." },
                        refreshToken: { type: "string", example: "eyJhbG..." },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
          },
          401: {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        summary: "Refresh access token",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: {
                    type: "string",
                    example: "eyJhbG...",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tokens refreshed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string", example: "eyJhbG..." },
                        refreshToken: { type: "string", example: "eyJhbG..." },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid, expired, or revoked refresh token",
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get current authenticated user profile",
        tags: ["Authentication"],
        security: [
          {
            BearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: "User details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "cm0..." },
                            name: { type: "string", example: "Jane Doe" },
                            email: { type: "string", example: "customer@example.com" },
                            role: { type: "string", example: "CUSTOMER" },
                            isActive: { type: "boolean", example: true },
                            emailVerified: { type: "boolean", example: false },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Authentication failed (invalid or missing access token)",
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Logout and invalidate refresh token",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: {
                    type: "string",
                    example: "eyJhbG...",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        message: { type: "string", example: "Logged out successfully" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
          },
        },
      },
    },
    "/api/auth/magic-link": {
      post: {
        summary: "Request a magic link for registration or login",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "customer@example.com",
                  },
                  name: {
                    type: "string",
                    example: "Jane Doe",
                    description: "Required for registration; omit for login",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Magic link sent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        message: { type: "string", example: "Magic link sent successfully. Please check your inbox." },
                        magicLink: { type: "string", example: "http://localhost:3000/auth/callback?token=..." },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or invalid action type",
          },
        },
      },
    },
    "/api/auth/magic-login": {
      post: {
        summary: "Verify magic link token and log the user in",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: {
                    type: "string",
                    example: "6c2bc4a0...",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful via magic link",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "cm0..." },
                            name: { type: "string", example: "Jane Doe" },
                            email: { type: "string", example: "customer@example.com" },
                            role: { type: "string", example: "CUSTOMER" },
                          },
                        },
                        accessToken: { type: "string", example: "eyJhbG..." },
                        refreshToken: { type: "string", example: "eyJhbG..." },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid or expired token",
          },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "Retrieve active support categories",
        tags: ["Categories"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Categories retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        categories: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", example: "uuid-123..." },
                              name: { type: "string", example: "Technical Support" },
                              description: { type: "string", example: "Software and hardware issues" },
                              isActive: { type: "boolean", example: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create a new category (Admin only)",
        tags: ["Categories"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Technical Support" },
                  description: { type: "string", example: "Software and hardware issues" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Category created successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Admin access required" },
          409: { description: "Category name already exists" },
        },
      },
    },
    "/api/tickets": {
      post: {
        summary: "Create a new support ticket (Customer only)",
        tags: ["Tickets"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "categoryId"],
                properties: {
                  title: { type: "string", example: "Cannot login to app" },
                  description: { type: "string", example: "Every time I open the app, it crashes on login screen." },
                  categoryId: { type: "string", format: "uuid", example: "uuid-category-123..." },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM", example: "HIGH" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Ticket created successfully" },
          400: { description: "Validation error or invalid category" },
          401: { description: "Unauthorized" },
        },
      },
      get: {
        summary: "List support tickets",
        description: "Returns owned tickets for customers, or all tickets in the system for admin/agents.",
        tags: ["Tickets"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Tickets retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        tickets: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", example: "uuid-ticket-123..." },
                              title: { type: "string", example: "Cannot login to app" },
                              description: { type: "string", example: "Every time I open the app, it crashes..." },
                              status: { type: "string", example: "OPEN" },
                              priority: { type: "string", example: "HIGH" },
                              createdAt: { type: "string", format: "date-time" },
                              updatedAt: { type: "string", format: "date-time" },
                              category: {
                                type: "object",
                                properties: {
                                  name: { type: "string", example: "Technical Support" },
                                },
                              },
                              customer: {
                                type: "object",
                                properties: {
                                  name: { type: "string", example: "Jane Doe" },
                                  email: { type: "string", example: "jane@example.com" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/tickets/{id}": {
      get: {
        summary: "Get support ticket details & message thread",
        tags: ["Tickets"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Ticket ID",
          },
        ],
        responses: {
          200: {
            description: "Ticket details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        ticket: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "uuid-ticket-123..." },
                            title: { type: "string", example: "Cannot login to app" },
                            description: { type: "string", example: "Detailed explanation" },
                            status: { type: "string", example: "OPEN" },
                            priority: { type: "string", example: "HIGH" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                            category: { type: "object" },
                            customer: { type: "object" },
                            agent: { type: "object", nullable: true },
                            messages: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string", example: "message-uuid-1..." },
                                  message: { type: "string", example: "Did you try updating the app?" },
                                  createdAt: { type: "string", format: "date-time" },
                                  sender: {
                                    type: "object",
                                    properties: {
                                      id: { type: "string", example: "user-uuid" },
                                      name: { type: "string", example: "Support Agent" },
                                      role: { type: "string", example: "AGENT" },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Access denied to this ticket" },
          404: { description: "Ticket not found" },
        },
      },
      patch: {
        summary: "Update support ticket status or priority",
        description: "Customers can only resolve or close their own tickets. Staff (agent/admin) can modify status and priority freely.",
        tags: ["Tickets"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Ticket ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], example: "RESOLVED" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], example: "HIGH" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Ticket updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Action forbidden" },
          404: { description: "Ticket not found" },
        },
      },
    },
    "/api/tickets/{id}/messages": {
      post: {
        summary: "Submit a message reply to the ticket thread",
        tags: ["Tickets"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Ticket ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", example: "Yes, I updated it but it still crashes." },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Message reply added successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        message: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "message-uuid" },
                            message: { type: "string", example: "Yes, I updated it but it still crashes." },
                            createdAt: { type: "string", format: "date-time" },
                            sender: { type: "object" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Validation error (empty message)" },
          401: { description: "Unauthorized" },
          403: { description: "Access denied to this ticket" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Access Token (without prefixing 'Bearer ')"
      },
    },
  },
};

/**
 * Configures and registers Swagger UI middleware on the /docs endpoint.
 */
export function setupSwagger(app: Express): void {
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpecification, {
      customSiteTitle: "OCS Helpdesk API Reference",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
}
