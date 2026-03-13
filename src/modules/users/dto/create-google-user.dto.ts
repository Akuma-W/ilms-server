import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  Matches,
  NotContains,
} from 'class-validator';

export class CreateGoogleUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
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

  @ApiProperty({
    description: 'Google Id (for Auth GG)',
    type: 'string',
    example: '123-456-7890',
  })
  @IsString()
  googleId: string;
}
