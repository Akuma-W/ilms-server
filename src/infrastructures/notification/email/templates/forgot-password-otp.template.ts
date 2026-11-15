import { EmailTemplate } from '../../interfaces/email-template.interface';

const ForgotPasswordOtpTemplate = {
  vi: {
    subject: 'KEIVerse - Yêu cầu đặt lại mật khẩu của bạn',
    content: {
      title: 'Yêu cầu đặt lại mật khẩu',
      description:
        'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản KEIVerse của bạn.',
      instruction:
        'Để tiếp tục thiết lập mật khẩu mới, vui lòng nhập mã xác thực bên dưới:',
      otpValidity:
        'Mã xác thực này có hiệu lực trong 5 phút. Vì lý do an toàn, vui lòng không cung cấp mã cho bất kỳ ai.',
      ignoreInstruction:
        'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu tài khoản của bạn sẽ không thay đổi.',
      teamSignature: 'Đội ngũ KEIVerse',
    },
    text: {
      firstLine: 'Yêu cầu đặt lại mật khẩu KEIVerse. Mã xác thực của bạn là: ',
      endline:
        'Mã có hiệu lực trong 5 phút. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.',
    },
  },
  en: {
    subject: 'KEIVerse - Password Reset Request',
    content: {
      title: 'Password Reset Request',
      description:
        'We received a request to reset the password associated with your KEIVerse account.',
      instruction:
        'To proceed with resetting your password, please enter the verification code below:',
      otpValidity:
        'This code will expire in 5 minutes. For security reasons, please do not share it with anyone.',
      ignoreInstruction:
        'If you did not request a password reset, please disregard this email. Your account password will remain unchanged.',
      teamSignature: 'The KEIVerse Team',
    },
    text: {
      firstLine:
        'KEIVerse - Password Reset Request. Your verification code is ',
      endline:
        'It will expire in 5 minutes. If you did not request this, please disregard this email.',
    },
  },
};

export const createForgotPasswordOtpTemplate = (
  otp: string,
  language: 'vi' | 'en',
): EmailTemplate => {
  const template = ForgotPasswordOtpTemplate[language];

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
          <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626; background-color: #fef2f2; padding: 12px 28px; border-radius: 12px; border: 1px dashed #f87171;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          ${template.content.otpValidity}
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          ${template.content.ignoreInstruction}
        </p>
        <p style="color: #1e293b; font-weight: bold; font-size: 13px;">${template.content.teamSignature}</p>
      </div>
    `,
    text: `${template.text.firstLine}${otp}. ${template.text.endline}`,
  };
};
