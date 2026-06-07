import { FastifyInstance } from 'fastify';
import { SurveyPublicationController } from './controllers/survey-publication.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function surveyPublicationRoutes(app: FastifyInstance) {
  const controller = new SurveyPublicationController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/surveys/:surveyId/publish', controller.publish.bind(controller));
  app.post('/surveys/:surveyId/archive', controller.archive.bind(controller));
}
