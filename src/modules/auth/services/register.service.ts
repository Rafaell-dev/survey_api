import { prisma } from '../../../lib/prisma';
import argon2 from 'argon2';
import { RegisterDto } from '../dtos/auth.schema';

export class RegisterService {
  async execute(data: RegisterDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      const error = new Error('Email já cadastrado');
      (error as any).status = 409;
      throw error;
    }

    const hashedPassword = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return user;
  }
}
