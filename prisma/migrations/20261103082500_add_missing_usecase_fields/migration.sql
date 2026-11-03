-- CreateEnum
CREATE TYPE "academic"."SchoolStatus" AS ENUM ('active', 'deactivated', 'archived');

-- AlterEnum
ALTER TYPE "academic"."EnrollmentStatus" ADD VALUE 'suspended';

-- DropIndex
DROP INDEX IF EXISTS "assign"."submissions_assignment_id_student_id_idx";

-- AlterTable
ALTER TABLE "academic"."schools" ADD COLUMN     "status" "academic"."SchoolStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "updated_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "academic"."classes" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meeting_space_id" TEXT,
ADD COLUMN     "meeting_uri" TEXT;

-- AlterTable
ALTER TABLE "auth"."users" ADD COLUMN     "updated_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "quiz"."quiz_attempts" ADD COLUMN     "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "assign"."submissions" ADD COLUMN     "is_late" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "forum"."forums" ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "forum"."comments" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "academic"."meeting_attendances" (
    "id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_minutes" INTEGER,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "meeting_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning"."material_progress" (
    "id" UUID NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "material_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "material_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_attendances_class_id_student_id_idx" ON "academic"."meeting_attendances"("class_id", "student_id");

-- CreateIndex
CREATE INDEX "material_progress_student_id_idx" ON "learning"."material_progress"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "material_progress_material_id_student_id_key" ON "learning"."material_progress"("material_id", "student_id");

-- CreateIndex
CREATE INDEX "schools_name_idx" ON "academic"."schools"("name");

-- CreateIndex
CREATE INDEX "schools_city_idx" ON "academic"."schools"("city");

-- CreateIndex
CREATE INDEX "classes_title_idx" ON "academic"."classes"("title");

-- CreateIndex
CREATE INDEX "enrollments_user_id_status_idx" ON "academic"."enrollments"("user_id", "status");

-- CreateIndex
CREATE INDEX "users_school_id_role_idx" ON "auth"."users"("school_id", "role");

-- CreateIndex
CREATE INDEX "users_full_name_idx" ON "auth"."users"("full_name");

-- CreateIndex
CREATE INDEX "submissions_student_id_idx" ON "assign"."submissions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignment_id_student_id_key" ON "assign"."submissions"("assignment_id", "student_id");

-- AddForeignKey
ALTER TABLE "academic"."meeting_attendances" ADD CONSTRAINT "meeting_attendances_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."meeting_attendances" ADD CONSTRAINT "meeting_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."material_progress" ADD CONSTRAINT "material_progress_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "learning"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."material_progress" ADD CONSTRAINT "material_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

