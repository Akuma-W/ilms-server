import { Module } from '@nestjs/common';
import { ForumsModule } from './forums/forums.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [ForumsModule, CommentsModule],
  exports: [ForumsModule, CommentsModule],
})
export class ForumModule {}
