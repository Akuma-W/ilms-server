import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyRegistrationOtpDto {
  @ApiProperty({
    description: 'User email waiting for registration OTP verification',
    type: 'string',
    example: 'user01@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '6-digit registration OTP code received via email',
    type: 'string',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 characters' })
  otp: string;
}
