-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN,
ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;
