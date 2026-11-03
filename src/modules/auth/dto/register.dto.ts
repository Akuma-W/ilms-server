import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  NotContains,
} from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class RegisterDto {
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

  @ApiProperty({
    description: 'User full name',
    type: 'string',
    example: 'Nguyen Van A',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'User role: student | teacher | admin',
    type: 'string',
    example: Role.student,
    enum: Role,
    default: Role.student,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: 'Id of user school',
    type: 'string',
    example: '133c7575-1b40-4ba3-9a24-9484964b9a24',
  })
  @IsUUID()
  schoolId: string;

  @ApiPropertyOptional({
    description: 'User identityCode (Student Identity)',
    type: 'string',
    example: 'SV123456',
  })
  @IsOptional()
  @IsString()
  identityCode?: string;
}
