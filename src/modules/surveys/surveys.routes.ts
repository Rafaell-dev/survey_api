import { FastifyInstance } from 'fastify';
import { SurveysController } from './controllers/surveys.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function surveysRoutes(app: FastifyInstance) {
  const surveysController = new SurveysController();

  // Aplica o guard em todas as rotas deste plugin
  app.addHook('preHandler', jwtAuthGuard);

  app.post('/', surveysController.create.bind(surveysController));
  app.get('/', surveysController.list.bind(surveysController));
  app.get('/:surveyId', surveysController.get.bind(surveysController));
  app.patch('/:surveyId', surveysController.update.bind(surveysController));
  app.delete('/:surveyId', surveysController.archive.bind(surveysController));
}
