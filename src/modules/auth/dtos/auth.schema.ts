import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Senha mínima de 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
