-- DropForeignKey
ALTER TABLE "comment_reports" DROP CONSTRAINT "comment_reports_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "paper_reports" DROP CONSTRAINT "paper_reports_paper_id_fkey";

-- AlterTable
ALTER TABLE "comment_reports" ADD COLUMN     "comment_author" TEXT,
ADD COLUMN     "comment_body" TEXT,
ALTER COLUMN "comment_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "paper_reports" ADD COLUMN     "paper_title" TEXT,
ALTER COLUMN "paper_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_reports" ADD CONSTRAINT "paper_reports_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
