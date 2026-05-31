import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { QuestionType } from '@prisma/client';

const mapType = (type: string): QuestionType => {
  switch (type) {
    case 'short_answer': return QuestionType.SHORT_TEXT;
    case 'paragraph': return QuestionType.LONG_TEXT;
    case 'multiple_choice': return QuestionType.SINGLE_CHOICE;
    case 'checkboxes': return QuestionType.MULTIPLE_CHOICE;
    default: return QuestionType.SHORT_TEXT;
  }
};

export async function questionRoutes(app: FastifyInstance) {
  // Hook para proteger as rotas
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  const verifyBlockOwnership = async (blockId: string, userId: string) => {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: { survey: true }
    });
    return block && block.survey.researcherId === userId;
  };

  // 1. Criar uma nova pergunta em um bloco
  app.post('/block/:blockId', async (request: FastifyRequest<{ Params: { blockId: string }, Body: { title: string; description?: string; type: string; required?: boolean; options?: string[] } }>, reply) => {
    const { blockId } = request.params;
    const { title, description, type, required, options } = request.body;
    const userId = (request.user as any).sub;

    if (!(await verifyBlockOwnership(blockId, userId))) {
      return reply.status(403).send({ message: 'Forbidden or block not found' });
    }

    const lastQuestion = await prisma.question.findFirst({
      where: { blockId },
      orderBy: { orderIndex: 'desc' }
    });
    const orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;

    const question = await prisma.question.create({
      data: {
        blockId,
        title,
        description,
        type: mapType(type),
        isRequired: required || false,
        orderIndex,
        options: options ? {
          create: options.map((opt, i) => ({
            label: opt,
            orderIndex: i
          }))
        } : undefined
      },
      include: {
        options: { orderBy: { orderIndex: 'asc' } }
      }
    });

    return reply.status(201).send(question);
  });

  // 2. Atualizar uma pergunta (e opcionalmente recriar as opções)
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: { title?: string; description?: string; type?: string; required?: boolean; orderIndex?: number; options?: string[] } }>, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const userId = (request.user as any).sub;

    const existingQuestion = await prisma.question.findUnique({ where: { id }, include: { block: { include: { survey: true } } } });
    if (!existingQuestion || existingQuestion.block.survey.researcherId !== userId) {
      return reply.status(403).send({ message: 'Forbidden or question not found' });
    }

    let updateData: any = {
      title: updates.title,
      description: updates.description,
      type: updates.type ? mapType(updates.type) : undefined,
      isRequired: updates.required,
      orderIndex: updates.orderIndex,
    };

    if (updates.options) {
      updateData.options = {
        deleteMany: {},
        create: updates.options.map((opt, i) => ({
          label: opt,
          orderIndex: i
        }))
      };
    }

    const updated = await prisma.question.update({
      where: { id },
      data: updateData,
      include: { options: { orderBy: { orderIndex: 'asc' } } }
    });

    return updated;
  });

  // 3. Deletar uma pergunta
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const userId = (request.user as any).sub;

    const existingQuestion = await prisma.question.findUnique({ where: { id }, include: { block: { include: { survey: true } } } });
    if (!existingQuestion || existingQuestion.block.survey.researcherId !== userId) {
      return reply.status(403).send({ message: 'Forbidden or question not found' });
    }

    await prisma.question.delete({ where: { id } });
    return reply.status(204).send();
  });
}
