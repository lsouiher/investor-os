-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'fr');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'en';
