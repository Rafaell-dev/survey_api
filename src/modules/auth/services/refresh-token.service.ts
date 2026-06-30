import { prisma } from '../../../lib/prisma';
import argon2 from 'argon2';
import { RefreshTokenDto } from '../dtos/auth.schema';
import { FastifyInstance } from 'fastify';
import crypto from 'crypto';

export class RefreshTokenService {
  constructor(private app: FastifyInstance) {}

  async execute(data: RefreshTokenDto) {
    const parts = data.refreshToken.split('.');
    
    if (parts.length !== 2) {
      const err = new Error('Refresh Token inválido');
      (err as any).status = 401;
      throw err;
    }

    const [sessionId, randomToken] = parts;

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      const err = new Error('Refresh Token inválido');
      (err as any).status = 401;
      throw err;
    }

    if (session.user.status === 'BLOCKED') {
      const err = new Error('Conta bloqueada. Aguarde a liberação do administrador.');
      (err as any).status = 403;
      throw err;
    }

    if (session.expiresAt < new Date()) {
      await prisma.userSession.delete({ where: { id: sessionId } });
      const err = new Error('Refresh Token expirado');
      (err as any).status = 401;
      throw err;
    }

    const isValidToken = await argon2.verify(session.refreshTokenHash, randomToken);

    if (!isValidToken) {
      const err = new Error('Refresh Token inválido');
      (err as any).status = 401;
      throw err;
    }

    // Rotacionar token
    const newRandomToken = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenHash = await argon2.hash(newRandomToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedSession = await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
        lastUsedAt: new Date()
      }
    });

    const accessToken = this.app.jwt.sign(
      { sub: session.user.id, email: session.user.email, role: session.user.role, status: session.user.status },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    return {
      accessToken,
      refreshToken: `${updatedSession.id}.${newRandomToken}`
    };
  }
}
