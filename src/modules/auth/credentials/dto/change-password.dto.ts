import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength, NotContains } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current user password',
    type: 'string',
    example: 'OldPassword@123',
  })
  @IsString()
  oldPassword: string;

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
