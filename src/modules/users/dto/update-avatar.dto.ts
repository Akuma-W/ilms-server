import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'User avatar/image',
    type: 'string',
    format: 'binary',
    example: 'http://localhost:9000/files/avatars/123abc.png',
  })
  avatar: Express.Multer.File;
}
