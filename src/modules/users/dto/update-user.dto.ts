import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  Matches,
  MinLength,
  NotContains,
} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User new password',
    type: 'string',
    example: 'Pass@wOrd123',
  })
  @IsOptional()
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
  password?: string;
}
