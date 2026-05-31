import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { ResponseStatus } from '@prisma/client';

export async function publicRoutes(app: FastifyInstance) {
  // 1. Obter o survey (se publicado) com toda sua estrutura
  app.get('/survey/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: { orderBy: { orderIndex: 'asc' } },
                rules: true,
                medias: true,
              }
            }
          }
        }
      }
    });

    if (!survey || survey.status !== 'PUBLISHED') {
      return reply.status(404).send({ message: 'Survey not found or not published' });
    }

    return survey;
  });

  // 2. Inicializar uma Resposta
  app.post('/survey/:id/start', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey || survey.status !== 'PUBLISHED') {
      return reply.status(404).send({ message: 'Survey not found or not published' });
    }

    // Cria um participante anônimo para essa resposta
    const participant = await prisma.participant.create({
      data: { identifier: 'anonymous' }
    });

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        participantId: participant.id,
        status: ResponseStatus.IN_PROGRESS
      }
    });

    return reply.status(201).send(response);
  });

  // 3. Salvar/Atualizar uma resposta para uma questão
  app.post('/response/:responseId/answer', async (request: FastifyRequest<{ Params: { responseId: string }, Body: { questionId: string; valueText?: string; valueNumber?: number; valueArray?: string[] } }>, reply) => {
    const { responseId } = request.params;
    const { questionId, valueText, valueNumber, valueArray } = request.body;

    const response = await prisma.surveyResponse.findUnique({ where: { id: responseId } });
    if (!response || response.status !== ResponseStatus.IN_PROGRESS) {
      return reply.status(400).send({ message: 'Invalid response session or already completed' });
    }

    const answer = await prisma.answer.findFirst({
      where: { responseId, questionId }
    });

    const textToSave = valueArray ? JSON.stringify(valueArray) : valueText;

    if (answer) {
      const updated = await prisma.answer.update({
        where: { id: answer.id },
        data: {
          textValue: textToSave,
          numericValue: valueNumber,
          createdAt: new Date()
        }
      });
      return updated;
    } else {
      const created = await prisma.answer.create({
        data: {
          responseId,
          questionId,
          textValue: textToSave,
          numericValue: valueNumber,
        }
      });
      return created;
    }
  });

  // 4. Finalizar o survey
  app.post('/response/:responseId/complete', async (request: FastifyRequest<{ Params: { responseId: string } }>, reply) => {
    const { responseId } = request.params;

    const updated = await prisma.surveyResponse.update({
      where: { id: responseId },
      data: {
        status: ResponseStatus.COMPLETED,
        finishedAt: new Date()
      }
    });

    return updated;
  });

  // 5. Salvar tracking de tempo no bloco
  app.post('/response/:responseId/track/block', async (request: FastifyRequest<{ Params: { responseId: string }, Body: { blockId: string; enteredAt: string; leftAt: string; timeSpentMs: number; orderIndex: number } }>, reply) => {
    const { responseId } = request.params;
    const { blockId, enteredAt, leftAt, timeSpentMs, orderIndex } = request.body;

    const tracking = await prisma.blockTracking.create({
      data: {
        responseId,
        blockId,
        enteredAt: new Date(enteredAt),
        leftAt: new Date(leftAt),
        timeSpentMs,
        orderIndex
      }
    });

    return reply.status(201).send(tracking);
  });
}
