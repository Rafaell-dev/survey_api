import { z } from 'zod';

// ==========================================
// PROFILE
// ==========================================
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres').optional(),
  title: z.string().max(100, 'Máximo 100 caracteres').nullable().optional(),
  institution: z.string().max(100, 'Máximo 100 caracteres').nullable().optional(),
  slug: z.string().min(1, 'Slug é obrigatório').max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Formato de link inválido').optional(),
  avatarUrl: z.string().nullable().optional(),
  aboutPt: z.string().max(3000, 'A biografia pode ter no máximo 3000 caracteres.').nullable().optional(),
  aboutEn: z.string().max(3000, 'A biografia pode ter no máximo 3000 caracteres.').nullable().optional(),
  githubUrl: z.string().url('URL inválida').max(200).nullable().optional().or(z.literal("")),
  showGithub: z.boolean().optional(),
  lattesUrl: z.string().url('URL inválida').max(200).nullable().optional().or(z.literal("")),
  showLattes: z.boolean().optional(),
  linkedinUrl: z.string().url('URL inválida').max(200).nullable().optional().or(z.literal("")),
  showLinkedin: z.boolean().optional(),
  email: z.string().email('E-mail inválido').max(100).or(z.literal("")).nullable().optional(),
  showEmail: z.boolean().optional(),
  address: z.string().max(300, 'Máximo 300 caracteres').nullable().optional().or(z.literal("")),
  themeColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida').nullable().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// ==========================================
// INTERESTS
// ==========================================
export const createInterestSchema = z.object({
  namePt: z.string().min(1, 'Nome em PT é obrigatório').max(50, 'Máximo 50 caracteres'),
  nameEn: z.string().min(1, 'Nome em EN é obrigatório').max(50, 'Máximo 50 caracteres'),
  orderIndex: z.number().int().optional(),
});

export const updateInterestSchema = createInterestSchema.partial();

export type CreateInterestDto = z.infer<typeof createInterestSchema>;
export type UpdateInterestDto = z.infer<typeof updateInterestSchema>;

// ==========================================
// EDUCATION
// ==========================================
export const createEducationSchema = z.object({
  degreePt: z.string().min(1, 'Grau em PT é obrigatório').max(100, 'Máximo 100 caracteres'),
  degreeEn: z.string().min(1, 'Grau em EN é obrigatório').max(100, 'Máximo 100 caracteres'),
  institution: z.string().min(1, 'Instituição é obrigatória').max(100, 'Máximo 100 caracteres'),
  year: z.number().int().min(1900).max(2100),
  orderIndex: z.number().int().optional(),
});

export const updateEducationSchema = createEducationSchema.partial();

export type CreateEducationDto = z.infer<typeof createEducationSchema>;
export type UpdateEducationDto = z.infer<typeof updateEducationSchema>;

// ==========================================
// EVENTS
// ==========================================
export const createEventSchema = z.object({
  titlePt: z.string().min(1, 'Título em PT é obrigatório'),
  titleEn: z.string().min(1, 'Título em EN é obrigatório'),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  institution: z.string().min(1, 'Instituição/Evento é obrigatório'),
  slidesUrl: z.string().nullable().optional(),
});

export const updateEventSchema = z.object({
  titlePt: z.string().min(1, 'Título em PT é obrigatório').optional(),
  titleEn: z.string().min(1, 'Título em EN é obrigatório').optional(),
  date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  institution: z.string().min(1, 'Instituição/Evento é obrigatório').optional(),
  slidesUrl: z.string().nullable().optional(),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;

// ==========================================
// PAGES
// ==========================================
export const createPageSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório'),
  titlePt: z.string().min(1, 'Título em PT é obrigatório'),
  titleEn: z.string().min(1, 'Título em EN é obrigatório'),
  contentPt: z.string().nullable().optional(),
  contentEn: z.string().nullable().optional(),
});

export const updatePageSchema = createPageSchema.partial();

export type CreatePageDto = z.infer<typeof createPageSchema>;
export type UpdatePageDto = z.infer<typeof updatePageSchema>;

// ==========================================
// TOOL CATEGORIES
// ==========================================
export const createToolCategorySchema = z.object({
  namePt: z.string().min(1, 'Nome em PT é obrigatório'),
  nameEn: z.string().min(1, 'Nome em EN é obrigatório'),
});

export const updateToolCategorySchema = createToolCategorySchema.partial();

export type CreateToolCategoryDto = z.infer<typeof createToolCategorySchema>;
export type UpdateToolCategoryDto = z.infer<typeof updateToolCategorySchema>;

// ==========================================
// TOOLS
// ==========================================
export const createToolSchema = z.object({
  name: z.string().min(1, 'Nome da ferramenta é obrigatório'),
  descriptionPt: z.string().min(1, 'Descrição em PT é obrigatória'),
  descriptionEn: z.string().min(1, 'Descrição em EN é obrigatória'),
  url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).optional(),
});

export const updateToolSchema = createToolSchema.partial();

export type CreateToolDto = z.infer<typeof createToolSchema>;
export type UpdateToolDto = z.infer<typeof updateToolSchema>;
