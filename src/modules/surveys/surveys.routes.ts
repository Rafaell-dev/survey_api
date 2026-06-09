import { FastifyInstance } from 'fastify';
import { SurveysController } from './controllers/surveys.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ExportController } from './controllers/export.controller';
import { PublicLinkController } from './controllers/public-link.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function surveysRoutes(app: FastifyInstance) {
  const surveysController = new SurveysController();

  // Aplica o guard em todas as rotas deste plugin
  app.addHook('preHandler', jwtAuthGuard);

  app.post('/', surveysController.create.bind(surveysController));
  app.get('/', surveysController.list.bind(surveysController));
  app.get('/:surveyId', surveysController.get.bind(surveysController));
  app.patch('/:surveyId', surveysController.update.bind(surveysController));
  app.patch('/:surveyId/settings', surveysController.updateSettings.bind(surveysController));
  app.put('/:surveyId/sync', surveysController.sync.bind(surveysController));
  app.delete('/:surveyId', surveysController.archive.bind(surveysController));

  // Analytics
  const analyticsController = new AnalyticsController();
  app.get('/:surveyId/analytics/overview', analyticsController.getOverview.bind(analyticsController));
  app.get('/:surveyId/analytics/questions', analyticsController.getQuestionsAnalytics.bind(analyticsController));
  app.get('/:surveyId/analytics/navigation', analyticsController.getNavigationAnalytics.bind(analyticsController));
  app.get('/:surveyId/analytics/media', analyticsController.getMediaAnalytics.bind(analyticsController));

  // Exports
  const exportController = new ExportController();
  app.get('/:surveyId/export/csv', exportController.exportCsv.bind(exportController));
  app.get('/:surveyId/export/xlsx', exportController.exportXlsx.bind(exportController));

  // Public Links
  const publicLinkController = new PublicLinkController();
  app.get('/:surveyId/public-link', publicLinkController.getLink.bind(publicLinkController));
  app.post('/:surveyId/public-link', publicLinkController.generateLink.bind(publicLinkController));
  app.patch('/:surveyId/public-link', publicLinkController.updateStatus.bind(publicLinkController));
}
