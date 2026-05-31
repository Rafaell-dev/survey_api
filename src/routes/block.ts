import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';

export async function blockRoutes(app: FastifyInstance) {
  // Hook para proteger as rotas de blocos
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Função auxiliar para verificar se o usuário é dono do survey
  const verifySurveyOwnership = async (surveyId: string, userId: string) => {
    const survey = await prisma.survey.findFirst({
      where: { id: surveyId, researcherId: userId }
    });
    return !!survey;
  };

  // 1. Listar blocos de um survey
  app.get('/survey/:surveyId', async (request: FastifyRequest<{ Params: { surveyId: string } }>, reply) => {
    const { surveyId } = request.params;
    const userId = (request.user as any).sub;

    if (!(await verifySurveyOwnership(surveyId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or survey not found' });
    }

    const blocks = await prisma.block.findMany({
      where: { surveyId },
      orderBy: { orderIndex: 'asc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return blocks;
  });

  // 2. Criar um novo bloco
  app.post('/survey/:surveyId', async (request: FastifyRequest<{ Params: { surveyId: string }, Body: { title?: string; description?: string } }>, reply) => {
    const { surveyId } = request.params;
    const { title, description } = request.body;
    const userId = (request.user as any).sub;

    if (!(await verifySurveyOwnership(surveyId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or survey not found' });
    }

    // Calcula a ordem correta (no final)
    const lastBlock = await prisma.block.findFirst({
      where: { surveyId },
      orderBy: { orderIndex: 'desc' }
    });
    const orderIndex = lastBlock ? lastBlock.orderIndex + 1 : 0;

    const block = await prisma.block.create({
      data: {
        surveyId,
        title: title || 'Novo Bloco',
        description,
        orderIndex,
      }
    });

    return reply.status(201).send(block);
  });

  // 3. Atualizar um bloco (incluindo reordenação opcional)
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: { title?: string; description?: string; orderIndex?: number } }>, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const userId = (request.user as any).sub;

    const existingBlock = await prisma.block.findUnique({ where: { id } });
    if (!existingBlock) return reply.status(404).send({ message: 'Block not found' });

    if (!(await verifySurveyOwnership(existingBlock.surveyId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or block not found' });
    }

    const updated = await prisma.block.update({
      where: { id },
      data: updates
    });

    return updated;
  });

  // 4. Deletar um bloco
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const userId = (request.user as any).sub;

    const existingBlock = await prisma.block.findUnique({ where: { id } });
    if (!existingBlock) return reply.status(404).send({ message: 'Block not found' });

    if (!(await verifySurveyOwnership(existingBlock.surveyId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or block not found' });
    }

    await prisma.block.delete({ where: { id } });
    return reply.status(204).send();
  });
}
