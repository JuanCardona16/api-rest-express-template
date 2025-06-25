import { Application, Request, Response } from 'express';
import path, { dirname } from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

// Obtener __dirname equivalente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Rest Node.js And Express',
      version: '2.0.0',
      description: 'API documentation for the Authentication System project',
      contact: {
        name: 'Juan David Cardona',
        email: 'jcardonabageth@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Ajusta las rutas según tu estructura de proyecto
  apis: [
    path.join(__dirname, '../../features/**/*.ts'),
    path.join(__dirname, '../../core/routes/*.ts'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI for the Express application.
 * @param {Express} app - The Express application instance.
 */
export const setupSwagger = (app: Application): void => {
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'API Rest With Node.js And Express',
      })
    );
  }

  // Ruta para obtener el JSON (opcional)
  app.get('/swagger.json', (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
