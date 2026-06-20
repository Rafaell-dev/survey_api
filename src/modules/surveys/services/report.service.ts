import { ReportRepository } from '../repositories/report.repository';
import { SurveyRepository } from '../repositories/survey.repository';
import { CreateReportDTO, UpdateReportDTO } from '../dtos/report.dto';

export class ReportService {
  constructor(
    private reportRepository: ReportRepository,
    private surveysRepository: SurveyRepository
  ) {}

  async createReport(surveyId: string, researcherId: string, data: CreateReportDTO) {
    await this.validateSurveyAccess(surveyId, researcherId);
    return this.reportRepository.create(surveyId, data);
  }

  async getReports(surveyId: string, researcherId: string) {
    await this.validateSurveyAccess(surveyId, researcherId);
    return this.reportRepository.findMany(surveyId);
  }

  async getReport(reportId: string, researcherId: string) {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      const err = new Error('Report not found');
      (err as any).status = 404;
      throw err;
    }
    await this.validateSurveyAccess(report.surveyId, researcherId);
    return report;
  }

  async updateReport(reportId: string, researcherId: string, data: UpdateReportDTO) {
    await this.getReport(reportId, researcherId); // validate access
    return this.reportRepository.update(reportId, data);
  }

  async deleteReport(reportId: string, researcherId: string) {
    await this.getReport(reportId, researcherId);
    return this.reportRepository.delete(reportId);
  }

  private async validateSurveyAccess(surveyId: string, researcherId: string) {
    const survey = await this.surveysRepository.findById(surveyId);
    if (!survey || survey.researcherId !== researcherId) {
      const err = new Error('Access denied to survey');
      (err as any).status = 403;
      throw err;
    }
  }
}
