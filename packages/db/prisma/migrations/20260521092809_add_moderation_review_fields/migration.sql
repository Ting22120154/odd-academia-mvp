-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'moderation';

-- AlterTable
ALTER TABLE "comment_reports" ADD COLUMN     "admin_note" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "resolved_by" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "body" TEXT;
