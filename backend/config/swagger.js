/**
 * Swagger configuration and setup for API documentation generation.
 * 
 * This module configures swagger-jsdoc to automatically generate OpenAPI
 * specification from JSDoc comments in route files. It defines:
 * - API metadata (title, version, description)
 * - Server configuration for different environments
 * - File paths to scan for API documentation
 * - Output configuration for swagger-ui-express
 * 
 * Generates the swagger-output.json file for API documentation.
 */

import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const __dirname = path.resolve();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastFood API',
      version: '1.0.0',
      description: 'API documentation for the FastFood project',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://fastfood.simonemiglio.eu',
        description: 'Production server',
      },
    ],
    components: {
      $ref: './api.yaml#/components',
    },
    security: [
      {
        cookieAuth: [],
      },
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, 'backend/routes/*.js'),
    path.join(__dirname, 'backend/config/api.yaml')
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;