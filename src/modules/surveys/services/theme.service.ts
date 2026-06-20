import { ThemeRepository } from '../repositories/theme.repository';
import { SurveyRepository } from '../repositories/survey.repository';
import { UpdateThemeDTO } from '../dtos/theme.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);

export class ThemeService {
  constructor(
    private themeRepository: ThemeRepository,
    private surveysRepository: SurveyRepository
  ) {}

  async getTheme(surveyId: string, researcherId: string) {
    await this.validateSurveyAccess(surveyId, researcherId);
    let theme = await this.themeRepository.findBySurveyId(surveyId);
    if (!theme) {
      theme = await this.themeRepository.upsert(surveyId, {});
    }
    return theme;
  }

  async updateTheme(surveyId: string, researcherId: string, data: UpdateThemeDTO) {
    await this.validateSurveyAccess(surveyId, researcherId);
    return this.themeRepository.upsert(surveyId, data);
  }

  async uploadHeaderImage(surveyId: string, researcherId: string, file: any) {
    await this.validateSurveyAccess(surveyId, researcherId);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'themes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.filename);
    const fileName = `header-${surveyId}-${uniqueSuffix}${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    await pump(file.file, fs.createWriteStream(filePath));

    const url = `/uploads/themes/${fileName}`;
    return this.themeRepository.upsert(surveyId, { headerImage: url });
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
