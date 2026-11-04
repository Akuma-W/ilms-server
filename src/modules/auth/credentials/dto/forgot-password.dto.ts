import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Registered user email to request password reset OTP',
    type: 'string',
    example: 'user01@gmail.com',
  })
  @IsEmail()
  email: string;
}
