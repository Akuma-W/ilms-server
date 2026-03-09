/*
  Warnings:

  - A unique constraint covering the columns `[shortname]` on the table `schools` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "academic"."schools" ADD COLUMN     "shortname" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "schools_shortname_key" ON "academic"."schools"("shortname");
