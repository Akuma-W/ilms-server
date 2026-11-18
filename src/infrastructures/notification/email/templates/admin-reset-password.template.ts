import { EmailTemplate } from '../../interfaces/email-template.interface';

const AdminResetPasswordTemplate = {
  vi: {
    subject: 'KEIVerse - Mật khẩu mới cho tài khoản của bạn',
    content: {
      title: 'Đặt lại mật khẩu bởi Quản trị viên',
      description:
        'Mật khẩu cho tài khoản KEIVerse của bạn vừa được Quản trị viên hệ thống đặt lại.',
      instruction:
        'Vui lòng sử dụng mật khẩu tạm thời bên dưới để đăng nhập vào hệ thống:',
      securityNote:
        'Vì lý do bảo mật, vui lòng đổi lại mật khẩu mới ngay sau khi đăng nhập thành công.',
      teamSignature: 'Đội ngũ Quản trị KEIVerse',
    },
    text: {
      firstLine:
        'Mật khẩu tài khoản KEIVerse của bạn đã được đặt lại bởi Quản trị viên. Mật khẩu tạm thời là: ',
      endline:
        'Vui lòng đăng nhập và đổi mật khẩu mới ngay để bảo đảm an toàn cho tài khoản.',
    },
  },
  en: {
    subject: 'KEIVerse - Your New Account Password',
    content: {
      title: 'Password Reset by Administrator',
      description:
        'Your KEIVerse account password has been reset by a system administrator.',
      instruction:
        'Please use the temporary password below to log in to your account:',
      securityNote:
        'For security reasons, please change your password immediately after logging in.',
      teamSignature: 'The KEIVerse Admin Team',
    },
    text: {
      firstLine:
        'Your KEIVerse account password has been reset by an administrator. Your temporary password is: ',
      endline:
        'Please log in and update your password immediately to keep your account secure.',
    },
  },
};

export const createAdminResetPasswordTemplate = (
  newPassword: string,
  language: 'vi' | 'en' = 'vi',
): EmailTemplate => {
  const template = AdminResetPasswordTemplate[language];

  return {
    subject: template.subject,
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">${template.content.title}</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          ${template.content.description}
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          ${template.content.instruction}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 24px; font-weight: 700; font-family: monospace; letter-spacing: 2px; color: #2563eb; background-color: #eff6ff; padding: 12px 28px; border-radius: 12px; border: 1px dashed #60a5fa;">
            ${newPassword}
          </span>
        </div>
        <p style="color: #dc2626; font-size: 13px; font-weight: 600; line-height: 1.5;">
          ${template.content.securityNote}
        </p>
        <p style="color: #1e293b; font-weight: bold; font-size: 13px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          ${template.content.teamSignature}
        </p>
      </div>
    `,
    text: `${template.text.firstLine}${newPassword}. ${template.text.endline}`,
  };
};
