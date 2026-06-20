import { FastifyRequest, FastifyReply } from 'fastify';
import { ThemeRepository } from '../repositories/theme.repository';
import { PrismaSurveyRepository } from '../repositories/survey.repository';
import { ThemeService } from '../services/theme.service';
import { UpdateThemeDTO } from '../dtos/theme.dto';
import { CloudflareR2StorageProvider } from '../../../providers/storage/CloudflareR2StorageProvider';

export class ThemeController {
  private service: ThemeService;

  constructor() {
    this.service = new ThemeService(
      new ThemeRepository(), 
      new PrismaSurveyRepository(),
      new CloudflareR2StorageProvider()
    );
  }

  async get(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const theme = await this.service.getTheme(request.params.surveyId, researcherId);
      return reply.send(theme);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { surveyId: string }; Body: UpdateThemeDTO }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const theme = await this.service.updateTheme(request.params.surveyId, researcherId, request.body);
      return reply.send(theme);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async uploadMedia(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ message: 'Arquivo não enviado' });
      }

      const theme = await this.service.uploadHeaderImage(request.params.surveyId, researcherId, data);
      return reply.send(theme);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
