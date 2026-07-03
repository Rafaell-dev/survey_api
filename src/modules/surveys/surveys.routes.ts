import { FastifyInstance } from 'fastify';
import { SurveysController } from './controllers/surveys.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ExportController } from './controllers/export.controller';
import { PublicLinkController } from './controllers/public-link.controller';
import { ReportController } from './controllers/report.controller';
import { ThemeController } from './controllers/theme.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function surveysRoutes(app: FastifyInstance) {
  // Aplica o guard em todas as rotas deste plugin
  app.addHook('preHandler', jwtAuthGuard);

  // Surveys
  const surveysController = new SurveysController();
  app.post('/', surveysController.create.bind(surveysController));
  app.get('/', surveysController.list.bind(surveysController));
  app.get('/metrics', surveysController.getMetrics.bind(surveysController));
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
  app.get('/:surveyId/analytics/responses', analyticsController.getResponses.bind(analyticsController));

  // Exports
  const exportController = new ExportController();
  app.get('/:surveyId/export/csv', exportController.exportCsv.bind(exportController));
  app.get('/:surveyId/export/xlsx', exportController.exportXlsx.bind(exportController));
  app.get('/:surveyId/reports/:reportId/export/csv', exportController.exportReportCsv.bind(exportController));
  app.get('/:surveyId/reports/:reportId/export/xlsx', exportController.exportReportXlsx.bind(exportController));

  // Reports
  const reportController = new ReportController();
  app.get('/:surveyId/reports', reportController.list.bind(reportController));
  app.post('/:surveyId/reports', reportController.create.bind(reportController));
  app.get('/:surveyId/reports/:reportId', reportController.get.bind(reportController));
  app.put('/:surveyId/reports/:reportId', reportController.update.bind(reportController));
  app.delete('/:surveyId/reports/:reportId', reportController.delete.bind(reportController));

  // Public Links
  const publicLinkController = new PublicLinkController();
  app.get('/:surveyId/public-link', publicLinkController.getLink.bind(publicLinkController));
  app.post('/:surveyId/public-link', publicLinkController.generateLink.bind(publicLinkController));
  app.patch('/:surveyId/public-link', publicLinkController.updateStatus.bind(publicLinkController));

  // Themes
  const themeController = new ThemeController();
  app.get('/:surveyId/theme', themeController.get.bind(themeController));
  app.put('/:surveyId/theme', themeController.update.bind(themeController));
  app.post('/:surveyId/theme/media', themeController.uploadMedia.bind(themeController));
}
