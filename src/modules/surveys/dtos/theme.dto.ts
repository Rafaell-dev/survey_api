import { ThemeLayout } from '@prisma/client';

export interface UpdateThemeDTO {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  fontFamily?: string;
  headerImage?: string;
  layout?: ThemeLayout;
}
