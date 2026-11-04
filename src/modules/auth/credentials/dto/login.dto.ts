import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  NotContains,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email used to login',
    uniqueItems: true,
    type: 'string',
    example: 'user01@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'User Password: Min 8 characters, 1 uppercase, 1 number, 1 special character, no whitespace',
    type: 'string',
    example: 'Password@123',
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
  password: string;
}
