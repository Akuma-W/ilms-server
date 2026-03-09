-- AddExtensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "academic";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ai";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "assign";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "chat";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "forum";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "learning";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "quiz";

-- CreateEnum
CREATE TYPE "auth"."Role" AS ENUM ('admin', 'student', 'teacher');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('locked', 'active', 'banned');

-- CreateEnum
CREATE TYPE "academic"."EnrollmentStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "learning"."FileType" AS ENUM ('video', 'pdf', 'link', 'slide', 'document');

-- CreateEnum
CREATE TYPE "quiz"."Visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "quiz"."QuizStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "quiz"."QuestionType" AS ENUM ('multiple_choice', 'multiple_select', 'true_false');

-- CreateEnum
CREATE TYPE "chat"."MessageType" AS ENUM ('text', 'image');

-- CreateEnum
CREATE TYPE "notification"."NotificationType" AS ENUM ('class_join_requested', 'class_join_approved', 'class_join_rejected', 'forum_replied', 'assignment_submitted', 'assignment_graded', 'assignment_due_soon', 'quiz_submitted', 'quiz_graded', 'grade_released', 'system_announcement');

-- CreateEnum
CREATE TYPE "notification"."RelatedType" AS ENUM ('quiz', 'assignment', 'forum', 'grade', 'class', 'system');

-- CreateEnum
CREATE TYPE "ai"."AIRequestType" AS ENUM ('chat', 'generate_outline', 'generate_exercise', 'generate_quiz', 'generate_slide', 'recommendation');

-- CreateTable
CREATE TABLE "academic"."schools" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic"."classes" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "course_code" TEXT,
    "semester" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ,
    "school_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic"."enrollments" (
    "id" UUID NOT NULL,
    "role_in" "auth"."Role" NOT NULL,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3),
    "status" "academic"."EnrollmentStatus" NOT NULL DEFAULT 'pending',
    "class_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic"."grade_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "class_id" UUID NOT NULL,

    CONSTRAINT "grade_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic"."grades" (
    "id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "category_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "google_id" TEXT,
    "identity_code" TEXT,
    "password" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "auth"."Role" NOT NULL,
    "avatar_url" TEXT,
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ,
    "school_id" UUID NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning"."topics" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER,
    "created_at" TIMESTAMPTZ,
    "class_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning"."materials" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "material_type" "learning"."FileType" NOT NULL,
    "file_url" TEXT,
    "external_url" TEXT,
    "created_at" TIMESTAMPTZ,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning"."references" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz"."quizzes" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time_limit" INTEGER NOT NULL,
    "visibility" "quiz"."Visibility" NOT NULL DEFAULT 'private',
    "status" "quiz"."QuizStatus" NOT NULL DEFAULT 'draft',
    "open_at" TIMESTAMP(3),
    "close_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz"."quiz_publications" (
    "id" UUID NOT NULL,
    "open_at" TIMESTAMP(3),
    "close_at" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "quiz_id" UUID NOT NULL,
    "class_id" UUID,
    "topic_id" UUID,

    CONSTRAINT "quiz_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz"."questions" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "question_type" "quiz"."QuestionType" NOT NULL,
    "points" DOUBLE PRECISION,
    "order_index" INTEGER,
    "quiz_id" UUID,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz"."options" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "question_id" UUID,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz"."quiz_attempts" (
    "id" UUID NOT NULL,
    "score" DOUBLE PRECISION,
    "submitted_at" TIMESTAMPTZ,
    "quiz_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz"."quiz_answers" (
    "id" UUID NOT NULL,
    "selected_option" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assign"."assignments" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMPTZ,
    "max_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,
    "class_id" UUID NOT NULL,
    "topic_id" UUID,
    "created_by" UUID NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assign"."assignment_materials" (
    "id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" "learning"."FileType",
    "created_at" TIMESTAMPTZ,
    "assignment_id" UUID NOT NULL,

    CONSTRAINT "assignment_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assign"."submissions" (
    "id" UUID NOT NULL,
    "text_answer" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assign"."submission_files" (
    "id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" "learning"."FileType",
    "created_at" TIMESTAMPTZ,
    "submission_id" UUID NOT NULL,

    CONSTRAINT "submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum"."forums" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ,
    "class_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "forums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum"."comments" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,
    "forum_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_id" UUID,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."chat_rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."chat_members" (
    "id" UUID NOT NULL,
    "role_in" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ,
    "room_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."messages" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" "chat"."MessageType" NOT NULL,
    "send_at" TIMESTAMPTZ,
    "room_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."reactions" (
    "reaction" TEXT,
    "created_at" TIMESTAMPTZ,
    "message_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("message_id","user_id")
);

-- CreateTable
CREATE TABLE "notification"."notification_events" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "notification"."NotificationType" NOT NULL,
    "related_type" "notification"."RelatedType" NOT NULL DEFAULT 'system',
    "related_id" UUID,
    "created_at" TIMESTAMP(3),
    "user_id" UUID NOT NULL,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."notification_deliveries" (
    "id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "app_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3),
    "event_id" UUID,
    "user_id" UUID,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."conversations" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ,
    "last_message_at" TIMESTAMPTZ,
    "user_id" UUID NOT NULL,
    "class_id" UUID,
    "topic_id" UUID,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."ai_messages" (
    "id" UUID NOT NULL,
    "role" TEXT,
    "content" TEXT NOT NULL,
    "token_count" INTEGER,
    "created_at" TIMESTAMP(3),
    "conversation_id" UUID,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."embeddings" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "chunk_index" INTEGER,
    "token_count" INTEGER,
    "created_at" TIMESTAMPTZ,
    "topic_id" UUID,
    "material_id" UUID,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."requests" (
    "id" UUID NOT NULL,
    "request_type" "ai"."AIRequestType" NOT NULL,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "latency_ms" INTEGER,
    "model" TEXT,
    "created_at" TIMESTAMPTZ,
    "user_id" UUID,
    "conversation_id" UUID,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."retrieval_cache" (
    "id" UUID NOT NULL,
    "query_hash" TEXT,
    "embedding_ids" TEXT[],
    "created_at" TIMESTAMPTZ,
    "topic_id" UUID,

    CONSTRAINT "retrieval_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "classes_teacher_id_idx" ON "academic"."classes"("teacher_id");

-- CreateIndex
CREATE INDEX "classes_course_code_idx" ON "academic"."classes"("course_code");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_class_id_user_id_key" ON "academic"."enrollments"("class_id", "user_id");

-- CreateIndex
CREATE INDEX "grades_category_id_student_id_idx" ON "academic"."grades"("category_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "auth"."users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_school_id_identity_code_key" ON "auth"."users"("school_id", "identity_code");

-- CreateIndex
CREATE INDEX "topics_class_id_idx" ON "learning"."topics"("class_id");

-- CreateIndex
CREATE INDEX "materials_topic_id_idx" ON "learning"."materials"("topic_id");

-- CreateIndex
CREATE INDEX "quizzes_created_by_idx" ON "quiz"."quizzes"("created_by");

-- CreateIndex
CREATE INDEX "quizzes_visibility_status_idx" ON "quiz"."quizzes"("visibility", "status");

-- CreateIndex
CREATE INDEX "quiz_publications_quiz_id_idx" ON "quiz"."quiz_publications"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_publications_topic_id_idx" ON "quiz"."quiz_publications"("topic_id");

-- CreateIndex
CREATE INDEX "quiz_publications_open_at_close_at_idx" ON "quiz"."quiz_publications"("open_at", "close_at");

-- CreateIndex
CREATE INDEX "quiz_publications_is_public_open_at_idx" ON "quiz"."quiz_publications"("is_public", "open_at");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_publications_quiz_id_class_id_key" ON "quiz"."quiz_publications"("quiz_id", "class_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_student_id_idx" ON "quiz"."quiz_attempts"("quiz_id", "student_id");

-- CreateIndex
CREATE INDEX "quiz_answers_attempt_id_idx" ON "quiz"."quiz_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "quiz_answers_attempt_id_question_id_idx" ON "quiz"."quiz_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "assignments_class_id_idx" ON "assign"."assignments"("class_id");

-- CreateIndex
CREATE INDEX "assignments_topic_id_idx" ON "assign"."assignments"("topic_id");

-- CreateIndex
CREATE INDEX "assignments_class_id_due_at_idx" ON "assign"."assignments"("class_id", "due_at");

-- CreateIndex
CREATE INDEX "assignment_materials_assignment_id_idx" ON "assign"."assignment_materials"("assignment_id");

-- CreateIndex
CREATE INDEX "submissions_assignment_id_student_id_idx" ON "assign"."submissions"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "submission_files_submission_id_idx" ON "assign"."submission_files"("submission_id");

-- CreateIndex
CREATE INDEX "forums_class_id_idx" ON "forum"."forums"("class_id");

-- CreateIndex
CREATE INDEX "forums_created_by_idx" ON "forum"."forums"("created_by");

-- CreateIndex
CREATE INDEX "forums_class_id_created_at_idx" ON "forum"."forums"("class_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_forum_id_idx" ON "forum"."comments"("forum_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "forum"."comments"("parent_id");

-- CreateIndex
CREATE INDEX "comments_forum_id_created_at_idx" ON "forum"."comments"("forum_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_rooms_created_by_idx" ON "chat"."chat_rooms"("created_by");

-- CreateIndex
CREATE INDEX "chat_members_member_id_idx" ON "chat"."chat_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_room_id_member_id_key" ON "chat"."chat_members"("room_id", "member_id");

-- CreateIndex
CREATE INDEX "messages_room_id_idx" ON "chat"."messages"("room_id");

-- CreateIndex
CREATE INDEX "messages_room_id_send_at_idx" ON "chat"."messages"("room_id", "send_at");

-- CreateIndex
CREATE INDEX "reactions_message_id_user_id_idx" ON "chat"."reactions"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_user_id_idx" ON "notification"."notification_deliveries"("user_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_user_id_is_read_idx" ON "notification"."notification_deliveries"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "embeddings_topic_id_idx" ON "ai"."embeddings"("topic_id");

-- CreateIndex
CREATE INDEX "embeddings_material_id_idx" ON "ai"."embeddings"("material_id");

-- CreateIndex
CREATE INDEX "requests_user_id_idx" ON "ai"."requests"("user_id");

-- CreateIndex
CREATE INDEX "requests_request_type_idx" ON "ai"."requests"("request_type");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "ai"."requests"("created_at");

-- CreateIndex
CREATE INDEX "retrieval_cache_topic_id_idx" ON "ai"."retrieval_cache"("topic_id");

-- CreateIndex
CREATE INDEX "retrieval_cache_query_hash_idx" ON "ai"."retrieval_cache"("query_hash");

-- AddForeignKey
ALTER TABLE "academic"."classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "academic"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."grade_categories" ADD CONSTRAINT "grade_categories_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."grades" ADD CONSTRAINT "grades_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "academic"."grade_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic"."grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "academic"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."topics" ADD CONSTRAINT "topics_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."topics" ADD CONSTRAINT "topics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."materials" ADD CONSTRAINT "materials_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."references" ADD CONSTRAINT "references_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quizzes" ADD CONSTRAINT "quizzes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_publications" ADD CONSTRAINT "quiz_publications_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_publications" ADD CONSTRAINT "quiz_publications_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_publications" ADD CONSTRAINT "quiz_publications_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"."quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."options" ADD CONSTRAINT "options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz"."questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_answers" ADD CONSTRAINT "quiz_answers_selected_option_fkey" FOREIGN KEY ("selected_option") REFERENCES "quiz"."options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz"."quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz"."quiz_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."assignments" ADD CONSTRAINT "assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."assignments" ADD CONSTRAINT "assignments_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."assignments" ADD CONSTRAINT "assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."assignment_materials" ADD CONSTRAINT "assignment_materials_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assign"."assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assign"."assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assign"."submission_files" ADD CONSTRAINT "submission_files_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "assign"."submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum"."forums" ADD CONSTRAINT "forums_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum"."forums" ADD CONSTRAINT "forums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum"."comments" ADD CONSTRAINT "comments_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forum"."forums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum"."comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum"."comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "forum"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."chat_rooms" ADD CONSTRAINT "chat_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."chat_members" ADD CONSTRAINT "chat_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat"."chat_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."chat_members" ADD CONSTRAINT "chat_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat"."chat_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "chat"."chat_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."reactions" ADD CONSTRAINT "reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat"."messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification"."notification_events" ADD CONSTRAINT "notification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification"."notification_deliveries" ADD CONSTRAINT "notification_deliveries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification"."notification_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification"."notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."conversations" ADD CONSTRAINT "conversations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."conversations" ADD CONSTRAINT "conversations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai"."conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."embeddings" ADD CONSTRAINT "embeddings_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."embeddings" ADD CONSTRAINT "embeddings_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "learning"."materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."requests" ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."requests" ADD CONSTRAINT "requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai"."conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."retrieval_cache" ADD CONSTRAINT "retrieval_cache_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
