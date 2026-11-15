import { EmailTemplate } from '../../interfaces/email-template.interface';

const RegisterOtpTemplate = {
  vi: {
    subject: 'Chào mừng bạn đến với KEIVerse - Xác thực tài khoản của bạn',
    content: {
      title: 'Chào mừng bạn đến với KEIVerse!',
      description:
        'Cảm ơn bạn đã tham gia KEIVerse – Nền tảng học tập trực tuyến tương tác thông minh.',
      instruction:
        'Để hoàn tất quá trình đăng ký và kích hoạt tài khoản của bạn, vui lòng sử dụng mã xác thực bên dưới:',
      otpValidity:
        'Mã xác thực này có hiệu lực trong 5 phút. Vì lý do bảo mật, vui lòng không chia sẻ mã này cho bất kỳ ai.',
      ignoreInstruction:
        'Nếu bạn không khởi tạo yêu cầu đăng ký này, bạn có thể an tâm bỏ qua email này.',
      teamSignature: 'Đội ngũ KEIVerse',
    },
    text: {
      firstLine:
        'Chào mừng bạn đến với KEIVerse! Mã xác thực đăng ký tài khoản của bạn là: ',
      endline:
        'Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.',
    },
  },
  en: {
    subject: 'Welcome to KEIVerse - Verify Your Account',
    content: {
      title: 'Welcome to KEIVerse!',
      description: 'Thank you for joining KEIVerse – Interactive LMS.',
      instruction:
        'To complete your registration and activate your account, please use the verification code below.',
      otpValidity:
        'This code will expire in 5 minutes. Please do not share it with anyone.',
      ignoreInstruction:
        'If you did not initiate this registration, you can safely ignore this email.',
      teamSignature: 'The KEIVerse Team',
    },
    text: {
      firstLine: 'Welcome to KEIVerse! Your verification code is ',
      endline:
        'It will expire in 5 minutes. Please do not share it with anyone.',
    },
  },
};

export const createRegisterOtpTemplate = (
  otp: string,
  language: 'vi' | 'en',
): EmailTemplate => {
  const template = RegisterOtpTemplate[language];

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
          <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 12px 28px; border-radius: 12px; border: 1px dashed #60a5fa;">
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
