import { FastifyInstance } from 'fastify';
import { PublicSurveyController } from './controllers/public-survey.controller';

export async function publicSurveyRoutes(app: FastifyInstance) {
  const controller = new PublicSurveyController();

  app.get('/public/surveys/:surveyId', controller.getSurvey.bind(controller));
  app.post('/public/surveys/:surveyId/start', controller.startSurvey.bind(controller));
  
  app.get('/public/responses/:responseId', controller.resumeSurvey.bind(controller));
}
