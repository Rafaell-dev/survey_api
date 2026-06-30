import { prisma } from '../../../lib/prisma';
import argon2 from 'argon2';
import { UpdateAccessDto, UpdatePasswordDto, UpdateTypeDto } from '../dtos/users.schema';

export class UsersService {
  async listAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateAccess(userId: string, data: UpdateAccessDto) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: data.status },
      select: { id: true, email: true, status: true }
    });
  }

  async updateType(userId: string, data: UpdateTypeDto) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: data.role },
      select: { id: true, email: true, role: true }
    });
  }

  async updatePassword(userId: string, data: UpdatePasswordDto) {
    const hashedPassword = await argon2.hash(data.password);
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, email: true }
    });
  }
}
