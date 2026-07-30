import { FastifyRequest, FastifyReply } from 'fastify';
import { portfolioPublicService } from '../services/portfolio-public.service';

export class PortfolioPublicController {
  async getPortfolio(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const data = await portfolioPublicService.getPortfolioData(request.params.slug);
    return reply.send(data);
  }
}
