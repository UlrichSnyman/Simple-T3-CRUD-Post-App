import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "T3 Stack API",
        version: "1.0.0",
        description: "API documentation for T3 Stack application with User authentication and Posts",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [
        {
          name: "Posts",
          description: "Post management endpoints",
        },
        {
          name: "Users",
          description: "User management endpoints",
        },
        {
          name: "Auth",
          description: "Authentication endpoints",
        },
      ],
      components: {
        schemas: {
          Post: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "My First Post" },
              description: { type: "string", nullable: true, example: "This is my first post on the platform!" },
              image: { type: "string", nullable: true, example: "https://example.com/image.jpg" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              createdById: { type: "string" },
            },
          },
          CreatePost: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", example: "My New Post" },
              description: { type: "string", example: "A detailed description of the post" },
              image: { type: "string", example: "https://example.com/image.jpg" },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", example: "John Doe" },
              email: { type: "string", example: "john@example.com" },
              image: { type: "string", nullable: true },
            },
          },
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
        securitySchemes: {
          sessionAuth: {
            type: "apiKey",
            in: "cookie",
            name: "next-auth.session-token",
          },
        },
      },
    },
  });
  return spec;
};
