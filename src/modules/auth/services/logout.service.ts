import { prisma } from '../../../lib/prisma';

export class LogoutService {
  async execute(refreshToken: string) {
    if (!refreshToken) return { success: true };

    const parts = refreshToken.split('.');
    
    if (parts.length === 2) {
      const [sessionId] = parts;
      try {
        await prisma.userSession.delete({
          where: { id: sessionId }
        });
      } catch (err) {
        // Ignora caso a sessão já tenha sido deletada
      }
    }

    return { success: true };
  }
}
