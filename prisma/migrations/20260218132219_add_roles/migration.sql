-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR');

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Supervisor" ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'SUPERVISOR';
