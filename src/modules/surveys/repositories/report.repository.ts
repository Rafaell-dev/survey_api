import { prisma } from '../../../lib/prisma';
import { CreateReportDTO, UpdateReportDTO } from '../dtos/report.dto';

export class ReportRepository {
  async create(surveyId: string, data: CreateReportDTO) {
    return prisma.report.create({
      data: {
        name: data.name,
        filters: data.filters,
        surveyId,
      },
    });
  }

  async findMany(surveyId: string) {
    return prisma.report.findMany({
      where: { surveyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(reportId: string) {
    return prisma.report.findUnique({
      where: { id: reportId },
    });
  }

  async update(reportId: string, data: UpdateReportDTO) {
    return prisma.report.update({
      where: { id: reportId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.filters && { filters: data.filters }),
      },
    });
  }

  async delete(reportId: string) {
    return prisma.report.delete({
      where: { id: reportId },
    });
  }
}
