import { ThemeRepository } from "../repositories/theme.repository";
import { SurveyRepository } from "../repositories/survey.repository";
import { UpdateThemeDTO } from "../dtos/theme.dto";
import { StorageProvider } from "../../../providers/storage/StorageProvider";
import { randomUUID } from "crypto";

export class ThemeService {
  constructor(
    private themeRepository: ThemeRepository,
    private surveysRepository: SurveyRepository,
    private storageProvider: StorageProvider,
  ) {}

  async getTheme(surveyId: string, researcherId: string) {
    await this.validateSurveyAccess(surveyId, researcherId);
    let theme = await this.themeRepository.findBySurveyId(surveyId);
    if (!theme) {
      theme = await this.themeRepository.upsert(surveyId, {});
    }
    return theme;
  }

  async updateTheme(
    surveyId: string,
    researcherId: string,
    data: UpdateThemeDTO,
  ) {
    await this.validateSurveyAccess(surveyId, researcherId);
    return this.themeRepository.upsert(surveyId, data);
  }

  async uploadHeaderImage(surveyId: string, researcherId: string, file: any) {
    await this.validateSurveyAccess(surveyId, researcherId);

    const buffer = await file.toBuffer();
    const extension = file.filename.split(".").pop();
    const uuid = randomUUID();
    const key = `surveys/${surveyId}/themes/${uuid}.${extension}`;

    const url = await this.storageProvider.upload(buffer, key, file.mimetype);

    return this.themeRepository.upsert(surveyId, { headerImage: url });
  }

  private async validateSurveyAccess(surveyId: string, researcherId: string) {
    const survey = await this.surveysRepository.findById(surveyId);
    if (!survey || survey.researcherId !== researcherId) {
      const err = new Error("Access denied to survey");
      (err as any).status = 403;
      throw err;
    }
  }
}
