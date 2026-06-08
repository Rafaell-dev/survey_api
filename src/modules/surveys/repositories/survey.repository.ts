import { Survey } from '@prisma/client';
import { prisma } from '../../../lib/prisma';

export interface CreateSurveyInput {
  title: string;
  description?: string;
  instructions?: string;
  researcherId: string;
}

export interface UpdateSurveyInput {
  title?: string;
  description?: string;
  instructions?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface UpdateSurveySettingsInput {
  participantIdentificationType?: 'ANONYMOUS' | 'EMAIL' | 'PHONE' | 'EMAIL_OR_PHONE' | 'NAME_AND_EMAIL';
  allowMultipleResponses?: boolean;
}

export interface ListSurveysFilters {
  researcherId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface SurveyRepository {
  create(data: CreateSurveyInput): Promise<Survey>;
  findById(id: string): Promise<Survey | null>;
  findMany(filters: ListSurveysFilters): Promise<Survey[]>;
  count(filters: ListSurveysFilters): Promise<number>;
  update(id: string, data: UpdateSurveyInput): Promise<Survey>;
  updateSettings(id: string, data: UpdateSurveySettingsInput): Promise<Survey>;
}

export class PrismaSurveyRepository implements SurveyRepository {
  async create(data: CreateSurveyInput): Promise<Survey> {
    return prisma.survey.create({
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        status: 'DRAFT',
        researcherId: data.researcherId
      }
    });
  }

  async findById(id: string): Promise<Survey | null> {
    return prisma.survey.findUnique({
      where: { id }
    });
  }

  async findMany(filters: ListSurveysFilters): Promise<Survey[]> {
    const { researcherId, page, limit, search } = filters;
    
    return prisma.survey.findMany({
      where: {
        researcherId,
        status: { not: 'ARCHIVED' },
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
  }

  async count(filters: ListSurveysFilters): Promise<number> {
    const { researcherId, search } = filters;

    return prisma.survey.count({
      where: {
        researcherId,
        status: { not: 'ARCHIVED' },
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
      }
    });
  }

  async update(id: string, data: UpdateSurveyInput): Promise<Survey> {
    return prisma.survey.update({
      where: { id },
      data
    });
  }

  async updateSettings(id: string, data: UpdateSurveySettingsInput): Promise<Survey> {
    return prisma.survey.update({
      where: { id },
      data
    });
  }
}
