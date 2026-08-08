import fastify, { FastifyInstance } from 'fastify'; 
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { authRoutes } from './modules/auth/auth.routes';
import { surveysRoutes } from './modules/surveys/surveys.routes';
import { blocksRoutes } from './modules/blocks/blocks.routes';
import { questionsRoutes } from './modules/questions/questions.routes';
import { scaleOptionsRoutes } from './modules/scale-options/scale-options.routes';
import { surveyPublicationRoutes } from './modules/surveys/survey-publication.routes';
import { questionOptionRoutes } from './modules/question-option/question-option.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { conditionalRuleRoutes } from './modules/conditional-rules/conditional-rule.routes';
import { publicSurveyRoutes } from './modules/public-surveys/public-survey.routes';
import { usersRoutes } from './modules/users/users.routes';
import { portfolioAdminRoutes, portfolioPublicRoutes } from './modules/portfolio/portfolio.routes';
import { publicRoutes } from './routes/public';

const app: FastifyInstance = fastify({ logger: true });

app.register(cors, { 
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

app.register(fastifyMultipart, {
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

app.register(fastifySwagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Survey API',
      description: 'Documentação da API de Pesquisas com Fastify e Scalar',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
});

app.register(fastifyApiReference, {
  routePrefix: '/docs',
  configuration: {
    theme: 'purple',
    spec: {
      content: () => app.swagger()
    }
  }
});

app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

app.register(authRoutes, { prefix: '/auth' });
app.register(surveysRoutes, { prefix: '/surveys' });
app.register(surveyPublicationRoutes);
app.register(blocksRoutes);
app.register(questionsRoutes);
app.register(scaleOptionsRoutes);
app.register(questionOptionRoutes);
app.register(mediaRoutes);
app.register(conditionalRuleRoutes);
app.register(usersRoutes, { prefix: '/users' });
app.register(portfolioAdminRoutes, { prefix: '/portfolio/admin' });
app.register(portfolioPublicRoutes, { prefix: '/portfolio/public' });

// Rotas públicas que não requerem autenticação JWT
app.register(publicSurveyRoutes);
app.register(publicRoutes, { prefix: '/public' });

app.get('/ping', {
  schema: {
    description: 'Verifica se a API está online',
    tags: ['Sistema'],
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          status: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  return { message: 'pong', status: 'API is running successfully!' };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3333;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
