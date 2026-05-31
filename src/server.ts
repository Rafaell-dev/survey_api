import fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth';
import { surveyRoutes } from './routes/survey';

const app: FastifyInstance = fastify({ logger: true });

app.register(cors, { 
  origin: true 
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

app.register(authRoutes, { prefix: '/auth' });
app.register(surveyRoutes, { prefix: '/surveys' });

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
