import { EmailTemplate } from '../../interfaces/email-template.interface';

export interface MeetingAnnouncementParams {
  classTitle: string;
  meetingTitle: string;
  startTime: Date;
  description?: string;
}

const MeetingAnnouncementContent = {
  vi: {
    subjectPrefix: '[Interactive LMS] Buổi học trực tuyến lớp',
    greeting: 'Xin chào bạn,',
    announcement: 'Lớp học',
    hasNewMeeting: 'vừa có buổi họp trực tuyến mới:',
    topicLabel: 'Chủ đề',
    timeLabel: 'Thời gian',
    notesLabel: 'Ghi chú',
    instruction:
      'Vui lòng đăng nhập vào hệ thống Interactive LMS để bấm tham gia và điểm danh tự động.',
    teamSignature: 'Ban Quản Trị Interactive LMS',
  },
  en: {
    subjectPrefix: '[Interactive LMS] Online Meeting for Class',
    greeting: 'Hello,',
    announcement: 'Class',
    hasNewMeeting: 'has scheduled a new online meeting session:',
    topicLabel: 'Topic',
    timeLabel: 'Time',
    notesLabel: 'Notes',
    instruction:
      'Please sign in to the Interactive LMS platform to join and log your attendance automatically.',
    teamSignature: 'The Interactive LMS Team',
  },
};

export const createMeetingAnnouncementTemplate = (
  params: MeetingAnnouncementParams,
  language: 'vi' | 'en' = 'en',
): EmailTemplate => {
  const content =
    MeetingAnnouncementContent[language] || MeetingAnnouncementContent.en;
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const formattedTime = new Date(params.startTime).toLocaleString(locale, {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const subject = `${content.subjectPrefix} ${params.classTitle} - ${params.meetingTitle}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5; margin-bottom: 16px;">${content.subjectPrefix} ${params.classTitle}</h2>
      <p>${content.greeting}</p>
      <p>${content.announcement} <strong>${params.classTitle}</strong> ${content.hasNewMeeting}</p>
      <ul style="background: #f9fafb; padding: 16px 24px; border-radius: 8px; list-style-type: disc;">
        <li><strong>${content.topicLabel}:</strong> ${params.meetingTitle}</li>
        <li><strong>${content.timeLabel}:</strong> ${formattedTime}</li>
        ${params.description ? `<li><strong>${content.notesLabel}:</strong> ${params.description}</li>` : ''}
      </ul>
      <p style="margin-top: 16px;">${content.instruction}</p>
      <br/>
      <p style="color: #6b7280; font-size: 14px;">${content.teamSignature}</p>
    </div>
  `;

  const text = `${content.greeting}\n\n${content.announcement} ${params.classTitle} ${content.hasNewMeeting}\n- ${content.topicLabel}: ${params.meetingTitle}\n- ${content.timeLabel}: ${formattedTime}\n${params.description ? `- ${content.notesLabel}: ${params.description}\n` : ''}\n${content.instruction}\n\n${content.teamSignature}`;

  return {
    subject,
    content: html,
    text,
  };
};
