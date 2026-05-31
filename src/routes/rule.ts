import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { RuleOperator } from '@prisma/client';

export async function ruleRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  const verifyQuestionOwnership = async (questionId: string, userId: string) => {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { block: { include: { survey: true } } }
    });
    return question && question.block.survey.researcherId === userId;
  };

  app.post('/question/:questionId', async (request: FastifyRequest<{ Params: { questionId: string }, Body: { operator: RuleOperator; matchValue: string; targetBlockId: string } }>, reply) => {
    const { questionId } = request.params;
    const { operator, matchValue, targetBlockId } = request.body;
    const userId = (request.user as any).sub;

    if (!(await verifyQuestionOwnership(questionId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or question not found' });
    }

    const rule = await prisma.conditionalRule.create({
      data: {
        questionId,
        operator,
        matchValue,
        targetBlockId
      }
    });

    return reply.status(201).send(rule);
  });

  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const userId = (request.user as any).sub;

    const rule = await prisma.conditionalRule.findUnique({
      where: { id },
      include: { question: true }
    });

    if (!rule || !(await verifyQuestionOwnership(rule.questionId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or rule not found' });
    }

    await prisma.conditionalRule.delete({ where: { id } });
    return reply.status(204).send();
  });
}
