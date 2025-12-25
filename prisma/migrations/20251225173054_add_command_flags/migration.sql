-- AlterTable
ALTER TABLE "CustomCommand" ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isModOnly" BOOLEAN NOT NULL DEFAULT false;
