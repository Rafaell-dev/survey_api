-- AlterTable
ALTER TABLE "PortfolioProfile" ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showGithub" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showLattes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showLinkedin" BOOLEAN NOT NULL DEFAULT true;
