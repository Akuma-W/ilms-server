import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendRegistrationOtpDto {
  @ApiProperty({
    description: 'User email to resend registration OTP verification code',
    type: 'string',
    example: 'user01@gmail.com',
  })
  @IsEmail()
  email: string;
}
