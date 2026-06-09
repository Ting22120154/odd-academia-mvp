-- ModerationAction: report review / dismiss (not content removal)
ALTER TYPE "ModerationAction" ADD VALUE IF NOT EXISTS 'review_report';
ALTER TYPE "ModerationAction" ADD VALUE IF NOT EXISTS 'dismiss_report';

-- PaperReport / UserReport: persist admin review notes (like comment_reports)
ALTER TABLE "paper_reports" ADD COLUMN IF NOT EXISTS "admin_note" TEXT;
ALTER TABLE "paper_reports" ADD COLUMN IF NOT EXISTS "outcome" TEXT;
ALTER TABLE "paper_reports" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);
ALTER TABLE "paper_reports" ADD COLUMN IF NOT EXISTS "resolved_by" TEXT;

ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "admin_note" TEXT;
ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "outcome" TEXT;
ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);
ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "resolved_by" TEXT;

-- Unique per-user paper views
CREATE TABLE IF NOT EXISTS "paper_views" (
    "id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "paper_views_paper_id_user_id_key" ON "paper_views"("paper_id", "user_id");
CREATE INDEX IF NOT EXISTS "paper_views_paper_id_idx" ON "paper_views"("paper_id");
CREATE INDEX IF NOT EXISTS "paper_views_user_id_idx" ON "paper_views"("user_id");

DO $$ BEGIN
  ALTER TABLE "paper_views" ADD CONSTRAINT "paper_views_paper_id_fkey"
    FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "paper_views" ADD CONSTRAINT "paper_views_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
