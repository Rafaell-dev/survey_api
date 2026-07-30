import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PortfolioAdminController } from './controllers/portfolio-admin.controller';
import { PortfolioPublicController } from './controllers/portfolio-public.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Guard para verificar se é ADMIN
async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
}

export async function portfolioPublicRoutes(app: FastifyInstance) {
  const publicController = new PortfolioPublicController();
  app.get('/:slug', publicController.getPortfolio.bind(publicController));
}

export async function portfolioAdminRoutes(app: FastifyInstance) {
  const adminController = new PortfolioAdminController();

  app.addHook('preHandler', jwtAuthGuard);
  app.addHook('preHandler', adminGuard);

  // Profile
  app.get('/profile', adminController.getProfile.bind(adminController));
  app.put('/profile', adminController.updateProfile.bind(adminController));
  app.post('/profile/avatar', adminController.uploadAvatar.bind(adminController));

  // Interests
  app.get('/interests', adminController.listInterests.bind(adminController));
  app.post('/interests', adminController.createInterest.bind(adminController));
  app.put('/interests/:id', adminController.updateInterest.bind(adminController));
  app.delete('/interests/:id', adminController.deleteInterest.bind(adminController));

  // Education
  app.get('/education', adminController.listEducations.bind(adminController));
  app.post('/education', adminController.createEducation.bind(adminController));
  app.put('/education/:id', adminController.updateEducation.bind(adminController));
  app.delete('/education/:id', adminController.deleteEducation.bind(adminController));

  // Events
  app.get('/events', adminController.listEvents.bind(adminController));
  app.post('/events', adminController.createEvent.bind(adminController));
  app.put('/events/:id', adminController.updateEvent.bind(adminController));
  app.delete('/events/:id', adminController.deleteEvent.bind(adminController));

  // Pages
  app.get('/pages', adminController.listPages.bind(adminController));
  app.get('/pages/:slug', adminController.getPage.bind(adminController));
  app.post('/pages', adminController.createPage.bind(adminController));
  app.put('/pages/:id', adminController.updatePage.bind(adminController));
  app.delete('/pages/:id', adminController.deletePage.bind(adminController));

  // Tool Categories
  app.get('/tool-categories', adminController.listToolCategories.bind(adminController));
  app.post('/tool-categories', adminController.createToolCategory.bind(adminController));
  app.put('/tool-categories/:id', adminController.updateToolCategory.bind(adminController));
  app.delete('/tool-categories/:id', adminController.deleteToolCategory.bind(adminController));

  // Tools
  app.get('/tools', adminController.listTools.bind(adminController));
  app.post('/tools', adminController.createTool.bind(adminController));
  app.put('/tools/:id', adminController.updateTool.bind(adminController));
  app.delete('/tools/:id', adminController.deleteTool.bind(adminController));
}
