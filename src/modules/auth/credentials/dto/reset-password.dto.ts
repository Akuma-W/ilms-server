import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MinLength,
  NotContains,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Registered user email',
    type: 'string',
    example: 'user01@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '6-digit OTP code received via email',
    type: 'string',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 characters' })
  otp: string;

  @ApiProperty({
    description:
      'New user password: Min 8 characters, 1 uppercase, 1 number, 1 special character, no whitespace',
    type: 'string',
    example: 'NewPassword@123',
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`]).{8,}$/,
    {
      message:
        'Password must contain at least 1 uppercase letter, 1 number and 1 special character',
    },
  )
  @NotContains(' ', { message: 'Password must not contain whitespace' })
  newPassword: string;
}
