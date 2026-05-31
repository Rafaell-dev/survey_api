import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';

export async function surveyRoutes(app: FastifyInstance) {
  // Hook para proteger todas as rotas neste plugin
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // 1. Listar surveys do pesquisador logado
  app.get('/', async (request, reply) => {
    const userId = (request.user as any).sub;
    
    const surveys = await prisma.survey.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    return surveys;
  });

  // 2. Obter detalhes de um survey específico
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const userId = (request.user as any).sub;
    
    const survey = await prisma.survey.findFirst({
      where: { id, researcherId: userId },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: { orderBy: { orderIndex: 'asc' } }
              }
            }
          }
        }
      }
    });

    if (!survey) {
      return reply.status(404).send({ message: 'Survey not found' });
    }
    
    return survey;
  });

  // 3. Criar um novo survey
  app.post('/', async (request: FastifyRequest<{ Body: { title: string; description?: string; instructions?: string } }>, reply) => {
    const { title, description, instructions } = request.body;
    const userId = (request.user as any).sub;

    if (!title) {
      return reply.status(400).send({ message: 'Title is required' });
    }

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        instructions,
        researcherId: userId
      }
    });

    return reply.status(201).send(survey);
  });

  // 4. Atualizar um survey existente
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: { title?: string; description?: string; instructions?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } }>, reply) => {
    const { id } = request.params;
    const { title, description, instructions, status } = request.body;
    const userId = (request.user as any).sub;

    const existing = await prisma.survey.findFirst({ where: { id, researcherId: userId } });
    if (!existing) {
      return reply.status(404).send({ message: 'Survey not found' });
    }

    const updated = await prisma.survey.update({
      where: { id },
      data: { title, description, instructions, status }
    });

    return updated;
  });

  // 4. Publicar um survey
  app.post('/:id/publish', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const userId = (request.user as any).sub;

    const existingSurvey = await prisma.survey.findUnique({ where: { id } });
    if (!existingSurvey || existingSurvey.researcherId !== userId) {
      return reply.status(403).send({ message: 'Forbidden or survey not found' });
    }

    const updated = await prisma.survey.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    return updated;
  });

  // 5. Deletar um survey
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const userId = (request.user as any).sub;

    const existing = await prisma.survey.findFirst({ where: { id, researcherId: userId } });
    if (!existing) {
      return reply.status(404).send({ message: 'Survey not found' });
    }

    await prisma.survey.delete({ where: { id } });
    
    return reply.status(204).send();
  });

  app.get('/:id/export', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: { questions: { orderBy: { orderIndex: 'asc' } } }
        },
        responses: {
          include: { answers: true, blockTrackings: true, mediaInteractions: true }
        }
      }
    });

    if (!survey) return reply.status(404).send({ message: 'Not found' });

    const questions: any[] = [];
    survey.blocks.forEach(b => questions.push(...b.questions));

    const headers = [
      'Response ID', 'Participant ID', 'Status', 'Started At', 'Finished At',
      ...questions.map(q => `"${q.title.replace(/"/g, '""')}"`),
      'Total Block Time (ms)', 'Media Interactions Count'
    ];

    const rows = [headers.join(',')];

    for (const resp of survey.responses) {
      const row = [
        resp.id,
        resp.participantId,
        resp.status,
        resp.startedAt.toISOString(),
        resp.finishedAt?.toISOString() || '',
      ];

      for (const q of questions) {
        const answer = resp.answers.find(a => a.questionId === q.id);
        let val = '';
        if (answer) {
          if (answer.textValue !== null) val = answer.textValue;
          else if (answer.numericValue !== null) val = String(answer.numericValue);
        }
        row.push(`"${val.replace(/"/g, '""')}"`);
      }

      const totalTime = resp.blockTrackings.reduce((acc, bt) => acc + (bt.timeSpentMs || 0), 0);
      row.push(String(totalTime));
      row.push(String(resp.mediaInteractions.length));

      rows.push(row.join(','));
    }

    const csvStr = rows.join('\n');
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="survey_${id}_export.csv"`);
    return reply.send(csvStr);
  });
}
