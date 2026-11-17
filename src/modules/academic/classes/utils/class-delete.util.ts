import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

/**
 * Safely cascades deletion of all dependent records before deleting classroom.
 * Prevents PostgreSQL foreign key constraint violations (P2003).
 */
export async function executeClassCascadeDelete(
  prisma: PrismaService,
  classId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Delete assignment submissions then assignments
    const assignments = await tx.assignment.findMany({
      where: { classId },
      select: { id: true },
    });
    if (assignments.length > 0) {
      const assignmentIds = assignments.map((a) => a.id);
      await tx.submission.deleteMany({
        where: { assignmentId: { in: assignmentIds } },
      });
      await tx.assignment.deleteMany({ where: { classId } });
    }

    // 2. Delete forum comments then forums
    const forums = await tx.forum.findMany({
      where: { classId },
      select: { id: true },
    });
    if (forums.length > 0) {
      const forumIds = forums.map((f) => f.id);
      await tx.comment.deleteMany({
        where: { forumId: { in: forumIds } },
      });
      await tx.forum.deleteMany({ where: { classId } });
    }

    // 3. Delete conversation messages then conversations
    const conversations = await tx.conversation.findMany({
      where: { classId },
      select: { id: true },
    });
    if (conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      await tx.message.deleteMany({
        where: { roomId: { in: conversationIds } },
      });
      await tx.conversation.deleteMany({ where: { classId } });
    }

    // 4. Delete quiz publications
    await tx.quizPublication.deleteMany({ where: { classId } });

    // 5. Delete topic materials & references then topics
    const topics = await tx.topic.findMany({
      where: { classId },
      select: { id: true },
    });
    if (topics.length > 0) {
      const topicIds = topics.map((t) => t.id);
      await tx.material.deleteMany({ where: { topicId: { in: topicIds } } });
      await tx.reference.deleteMany({ where: { topicId: { in: topicIds } } });
      await tx.topic.deleteMany({ where: { classId } });
    }

    // 6. Delete grades then grade categories
    const categories = await tx.gradeCategory.findMany({
      where: { classId },
      select: { id: true },
    });
    if (categories.length > 0) {
      const categoryIds = categories.map((c) => c.id);
      await tx.grade.deleteMany({
        where: { categoryId: { in: categoryIds } },
      });
      await tx.gradeCategory.deleteMany({ where: { classId } });
    }

    // 7. Delete meeting attendances
    await tx.meetingAttendance.deleteMany({ where: { classId } });

    // 8. Delete enrollments
    await tx.enrollment.deleteMany({ where: { classId } });

    // 9. Permanently delete the classroom record
    await tx.class.delete({ where: { id: classId } });
  });
}
