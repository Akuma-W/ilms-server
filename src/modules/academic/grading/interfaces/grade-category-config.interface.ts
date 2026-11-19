import { GradeCalculationStrategy } from '../constants/grade-strategy.constant';

export interface PillarWeightConfig {
  weight: number;
  minRate?: number;
  strictThreshold?: boolean;
}

export interface ProgressPillarsConfig {
  meetings?: PillarWeightConfig;
  materials?: PillarWeightConfig;
  assignments?: PillarWeightConfig;
  quizzes?: PillarWeightConfig;
}

export interface DirectItemWeightConfig {
  type: 'assignment' | 'quiz';
  id: string;
  weight: number;
}

export interface ThresholdCriterionConfig {
  minRate: number;
  points: number;
}

export interface CompositeItemConfig {
  type: 'assignment' | 'quiz';
  id: string;
  weight?: number;
}

export interface GradeCategoryConfig {
  strategy?: GradeCalculationStrategy;
  pillars?: ProgressPillarsConfig;
  directItems?: DirectItemWeightConfig[];
  thresholds?: {
    meeting?: ThresholdCriterionConfig;
    material?: ThresholdCriterionConfig;
    assignment?: ThresholdCriterionConfig;
    quiz?: ThresholdCriterionConfig;
  };
  directItem?: DirectItemWeightConfig;
  items?: CompositeItemConfig[];
  materialWeight?: number;
  meetingWeight?: number;
}
