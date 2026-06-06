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
