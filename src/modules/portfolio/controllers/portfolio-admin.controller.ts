import { FastifyRequest, FastifyReply } from 'fastify';
import { portfolioAdminService } from '../services/portfolio-admin.service';
import { CloudflareR2StorageProvider } from '../../../providers/storage/CloudflareR2StorageProvider';
import { 
  updateProfileSchema, createInterestSchema, updateInterestSchema,
  createEducationSchema, updateEducationSchema, createEventSchema, updateEventSchema,
  createPageSchema, updatePageSchema, createToolCategorySchema, updateToolCategorySchema,
  createToolSchema, updateToolSchema 
} from '../dtos/portfolio.schema';

export class PortfolioAdminController {
  // PROFILE
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const profile = await portfolioAdminService.getProfile(user.sub);
    return reply.send(profile);
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = updateProfileSchema.parse(request.body);
    const profile = await portfolioAdminService.updateProfile(user.sub, data);
    return reply.send(profile);
  }

  async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = await request.file();
    if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' });

    const buffer = await data.toBuffer();
    const storageProvider = new CloudflareR2StorageProvider();
    
    const key = `avatars/${user.sub}-${Date.now()}-${data.filename}`;
    const url = await storageProvider.upload(buffer, key, data.mimetype);

    const profile = await portfolioAdminService.updateProfile(user.sub, { avatarUrl: url });
    return reply.send(profile);
  }

  // INTERESTS
  async listInterests(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const interests = await portfolioAdminService.listInterests(user.sub);
    return reply.send(interests);
  }
  
  async createInterest(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = createInterestSchema.parse(request.body);
    const interest = await portfolioAdminService.createInterest(user.sub, data);
    return reply.status(201).send(interest);
  }

  async updateInterest(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const data = updateInterestSchema.parse(request.body);
    const interest = await portfolioAdminService.updateInterest(user.sub, request.params.id, data);
    return reply.send(interest);
  }

  async deleteInterest(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    await portfolioAdminService.deleteInterest(user.sub, request.params.id);
    return reply.status(204).send();
  }

  // EDUCATION
  async listEducations(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const educations = await portfolioAdminService.listEducations(user.sub);
    return reply.send(educations);
  }

  async createEducation(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = createEducationSchema.parse(request.body);
    const education = await portfolioAdminService.createEducation(user.sub, data);
    return reply.status(201).send(education);
  }

  async updateEducation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const data = updateEducationSchema.parse(request.body);
    const education = await portfolioAdminService.updateEducation(user.sub, request.params.id, data);
    return reply.send(education);
  }

  async deleteEducation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    await portfolioAdminService.deleteEducation(user.sub, request.params.id);
    return reply.status(204).send();
  }

  // EVENTS
  async listEvents(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const events = await portfolioAdminService.listEvents(user.sub);
    return reply.send(events);
  }

  async createEvent(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = createEventSchema.parse(request.body);
    const event = await portfolioAdminService.createEvent(user.sub, data);
    return reply.status(201).send(event);
  }

  async updateEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const data = updateEventSchema.parse(request.body);
    const event = await portfolioAdminService.updateEvent(user.sub, request.params.id, data);
    return reply.send(event);
  }

  async deleteEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    await portfolioAdminService.deleteEvent(user.sub, request.params.id);
    return reply.status(204).send();
  }

  // PAGES
  async listPages(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const pages = await portfolioAdminService.listPages(user.sub);
    return reply.send(pages);
  }

  async getPage(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const page = await portfolioAdminService.getPage(user.sub, request.params.slug);
    if (!page) return reply.status(404).send({ message: 'Página não encontrada' });
    return reply.send(page);
  }

  async createPage(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = createPageSchema.parse(request.body);
    const page = await portfolioAdminService.createPage(user.sub, data);
    return reply.status(201).send(page);
  }

  async updatePage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const data = updatePageSchema.parse(request.body);
    const page = await portfolioAdminService.updatePage(user.sub, request.params.id, data);
    return reply.send(page);
  }

  async deletePage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    await portfolioAdminService.deletePage(user.sub, request.params.id);
    return reply.status(204).send();
  }

  // TOOL CATEGORIES
  async listToolCategories(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const categories = await portfolioAdminService.listToolCategories(user.sub);
    return reply.send(categories);
  }

  async createToolCategory(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = createToolCategorySchema.parse(request.body);
    const category = await portfolioAdminService.createToolCategory(user.sub, data);
    return reply.status(201).send(category);
  }

  async updateToolCategory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const data = updateToolCategorySchema.parse(request.body);
    const category = await portfolioAdminService.updateToolCategory(user.sub, request.params.id, data);
    return reply.send(category);
  }

  async deleteToolCategory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    await portfolioAdminService.deleteToolCategory(user.sub, request.params.id);
    return reply.status(204).send();
  }

  // TOOLS
  async listTools(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const tools = await portfolioAdminService.listTools(user.sub);
    return reply.send(tools);
  }

  async createTool(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const data = createToolSchema.parse(request.body);
    const tool = await portfolioAdminService.createTool(user.sub, data);
    return reply.status(201).send(tool);
  }

  async updateTool(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    const data = updateToolSchema.parse(request.body);
    const tool = await portfolioAdminService.updateTool(user.sub, request.params.id, data);
    return reply.send(tool);
  }

  async deleteTool(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as any;
    await portfolioAdminService.deleteTool(user.sub, request.params.id);
    return reply.status(204).send();
  }

  // SURVEYS (Integração)
  async listSurveys(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    const surveys = await portfolioAdminService.listSurveys(user.sub);
    return reply.send(surveys);
  }

  async toggleSurveyHighlight(request: FastifyRequest<{ Params: { id: string }, Body: { isHighlighted: boolean } }>, reply: FastifyReply) {
    const user = request.user as any;
    const { isHighlighted } = request.body as { isHighlighted: boolean };
    const survey = await portfolioAdminService.toggleSurveyHighlight(user.sub, request.params.id, isHighlighted);
    return reply.send(survey);
  }
}
