import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaSurveyRepository } from '../repositories/survey.repository';
import { ValidateSurveyForPublicationService } from '../services/lifecycle/validate-survey-for-publication-service';
import { PublishSurveyService } from '../services/lifecycle/publish-survey.service';
import { ArchiveSurveyService } from '../services/lifecycle/archive-survey.service';

export class SurveyPublicationController {
  private repository = new PrismaSurveyRepository();
  private validator = new ValidateSurveyForPublicationService();

  async publish(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const service = new PublishSurveyService(this.repository, this.validator);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async archive(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const service = new ArchiveSurveyService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
