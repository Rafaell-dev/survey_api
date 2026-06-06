import fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { authRoutes } from './modules/auth/auth.routes';
import { surveysRoutes } from './modules/surveys/surveys.routes';
import { blocksRoutes } from './modules/blocks/blocks.routes';
import { questionRoutes } from './routes/question';
import { mediaRoutes } from './routes/media';
import { ruleRoutes } from './routes/rule';
import { publicRoutes } from './routes/public';

const app: FastifyInstance = fastify({ logger: true });

app.register(cors, { 
  origin: process.env.CORS_ORIGIN || '*'
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

app.register(fastifyMultipart, {
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
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
app.register(blocksRoutes);
app.register(questionRoutes, { prefix: '/questions' });
app.register(mediaRoutes, { prefix: '/media' });
app.register(ruleRoutes, { prefix: '/rules' });

// Rotas públicas que não requerem autenticação JWT
app.register(publicRoutes, { prefix: '/public' });

app.get('/ping', async (request, reply) => {
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
