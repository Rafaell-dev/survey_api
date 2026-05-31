import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';
import { MediaType } from '@prisma/client';

const pump = util.promisify(pipeline);

export async function mediaRoutes(app: FastifyInstance) {
  // Hook de proteção
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  app.post('/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }

    // Extrair possible questionId dos fields
    let questionIdValue: string | undefined = undefined;
    if (data.fields.questionId) {
      const field = data.fields.questionId as any;
      questionIdValue = field.value;
    }

    // Determinar o MediaType
    let type: MediaType = MediaType.IMAGE;
    if (data.mimetype.startsWith('video/')) type = MediaType.VIDEO;
    else if (data.mimetype.startsWith('audio/')) type = MediaType.AUDIO;

    // Salvar o arquivo
    const uniqueFileName = `${Date.now()}-${data.filename}`;
    const uploadPath = path.join(__dirname, '../../uploads', uniqueFileName);

    await pump(data.file, fs.createWriteStream(uploadPath));

    const url = `http://localhost:3333/uploads/${uniqueFileName}`;

    const media = await prisma.media.create({
      data: {
        type,
        url,
        fileName: uniqueFileName,
        questionId: questionIdValue || null
      }
    });

    return reply.status(201).send(media);
  });

  app.get('/question/:questionId', async (request: FastifyRequest<{ Params: { questionId: string } }>, reply) => {
    const medias = await prisma.media.findMany({
      where: { questionId: request.params.questionId }
    });
    return medias;
  });

  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return reply.status(404).send({ message: 'Media not found' });

    await prisma.media.delete({ where: { id } });

    const filePath = path.join(__dirname, '../../uploads', media.fileName || '');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return reply.status(204).send();
  });
}
