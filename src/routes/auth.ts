import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const { name, email, password } = request.body as any;

    if (!name || !email || !password) {
      return reply.status(400).send({ message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return reply.status(400).send({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    return reply.status(201).send({ message: 'User created successfully', userId: user.id });
  });

  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const token = app.jwt.sign({
      sub: user.id,
      name: user.name,
      email: user.email,
    }, {
      expiresIn: '7d'
    });

    return reply.send({ token });
  });
}
