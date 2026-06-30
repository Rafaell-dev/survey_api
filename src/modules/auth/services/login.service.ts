import { prisma } from '../../../lib/prisma';
import argon2 from 'argon2';
import { LoginDto } from '../dtos/auth.schema';
import { FastifyInstance } from 'fastify';
import crypto from 'crypto';

export class LoginService {
  constructor(private app: FastifyInstance) {}

  async execute(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      const error = new Error('Credenciais inválidas');
      (error as any).status = 401;
      throw error;
    }

    if (user.status === 'BLOCKED') {
      const error = new Error('Conta bloqueada. Aguarde a liberação do administrador.');
      (error as any).status = 403;
      throw error;
    }

    const isValidPassword = await argon2.verify(user.password, data.password);

    if (!isValidPassword) {
      const error = new Error('Credenciais inválidas');
      (error as any).status = 401;
      throw error;
    }

    const accessToken = this.app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role, status: user.status },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    const randomToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await argon2.hash(randomToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt
      }
    });

    // Retorna o token no formato sessionId.randomToken
    // Assim o backend pode buscar a sessão pelo ID (O(1)) e validar o randomToken com argon2
    const refreshToken = `${session.id}.${randomToken}`;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }
}
