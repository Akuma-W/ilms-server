import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { createMeetingAnnouncementTemplate } from 'src/infrastructures/notification/email/templates/meeting-announcement.template';

// Dispatches email notification to all approved students when a meeting is created
export async function dispatchMeetingAnnouncement(
  prisma: PrismaService,
  notification: NotificationFacade,
  classId: string,
  meetingTitle: string,
  startTime: Date,
  description?: string,
  language: 'vi' | 'en' = 'en',
): Promise<number> {
  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { title: true },
  });

  if (!targetClass) return 0;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      status: 'approved',
    },
    include: {
      user: {
        select: { email: true, fullName: true },
      },
    },
  });

  const template = createMeetingAnnouncementTemplate(
    {
      classTitle: targetClass.title,
      meetingTitle,
      startTime,
      description,
    },
    language,
  );

  let sentCount = 0;
  for (const enr of enrollments) {
    if (enr.user.email) {
      await notification.sendEmail({
        to: enr.user.email,
        subject: template.subject,
        content: template.content,
        html: template.content,
      });
      sentCount += 1;
    }
  }

  return sentCount;
}
