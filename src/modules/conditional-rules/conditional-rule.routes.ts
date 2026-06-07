import { FastifyInstance } from 'fastify';
import { ConditionalRuleController } from './controllers/conditional-rule.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function conditionalRuleRoutes(app: FastifyInstance) {
  const controller = new ConditionalRuleController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/questions/:questionId/rules', controller.create.bind(controller));
  app.get('/questions/:questionId/rules', controller.list.bind(controller));
  
  app.get('/rules/:ruleId', controller.get.bind(controller));
  app.patch('/rules/:ruleId', controller.update.bind(controller));
  app.delete('/rules/:ruleId', controller.delete.bind(controller));
}
