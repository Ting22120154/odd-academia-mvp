-- AlterTable: new users default to undisclosed (none) work status
ALTER TABLE "users" ALTER COLUMN "work_status" SET DEFAULT 'none';
