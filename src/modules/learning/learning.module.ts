import { Module } from '@nestjs/common';
import { MaterialsModule } from './materials/materials.module';
import { ReferencesModule } from './references/references.module';
import { TopicsModule } from './topics/topics.module';

@Module({
  imports: [TopicsModule, MaterialsModule, ReferencesModule],
  exports: [TopicsModule, MaterialsModule, ReferencesModule],
})
export class LearningModule {}
