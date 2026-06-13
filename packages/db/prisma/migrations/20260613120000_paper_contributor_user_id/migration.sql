-- AlterTable: link paper contributors to platform users (optional)
ALTER TABLE "paper_contributors" ADD COLUMN "contributor_user_id" TEXT;

CREATE INDEX "paper_contributors_contributor_user_id_idx" ON "paper_contributors"("contributor_user_id");

ALTER TABLE "paper_contributors" ADD CONSTRAINT "paper_contributors_contributor_user_id_fkey" FOREIGN KEY ("contributor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
