import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { checkQuizOwnership } from '../utils/quiz-permission.util';
import {
  CreateQuestionDto,
  ReorderQuestionsDto,
  UpdateQuestionDto,
} from './dto';
import { QuestionEntity } from './entities/question.entity';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create single question with options under a quiz
  async createQuestion(
    userId: string,
    quizId: string,
    dto: CreateQuestionDto,
  ): Promise<QuestionEntity> {
    await checkQuizOwnership(this.prisma, quizId, userId);

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const currentCount = await this.prisma.question.count({
        where: { quizId },
      });
      orderIndex = currentCount + 1;
    }

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          quizId,
          content: dto.content,
          questionType: dto.questionType,
          points: dto.points ?? 1.0,
          orderIndex,
          explanation: dto.explanation,
        },
      });

      if (dto.options && dto.options.length > 0) {
        await tx.option.createMany({
          data: dto.options.map((opt) => ({
            questionId: question.id,
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        });
      }

      const created = await tx.question.findUnique({
        where: { id: question.id },
        include: { options: true },
      });

      if (!created) {
        throw new NotFoundException('Created question not found');
      }

      return created as QuestionEntity;
    });
  }

  // Batch create multiple questions (used for Word docx import parser)
  async batchCreateQuestions(
    userId: string,
    quizId: string,
    dtos: CreateQuestionDto[],
  ): Promise<QuestionEntity[]> {
    await checkQuizOwnership(this.prisma, quizId, userId);

    const currentCount = await this.prisma.question.count({
      where: { quizId },
    });

    return this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < dtos.length; i++) {
        const dto = dtos[i];
        const orderIndex = dto.orderIndex ?? currentCount + i + 1;

        const question = await tx.question.create({
          data: {
            quizId,
            content: dto.content,
            questionType: dto.questionType,
            points: dto.points ?? 1.0,
            orderIndex,
            explanation: dto.explanation,
          },
        });

        if (dto.options && dto.options.length > 0) {
          await tx.option.createMany({
            data: dto.options.map((opt) => ({
              questionId: question.id,
              content: opt.content,
              isCorrect: opt.isCorrect,
            })),
          });
        }
      }

      const questions = await tx.question.findMany({
        where: { quizId },
        orderBy: { orderIndex: 'asc' },
        include: { options: true },
      });

      return questions as QuestionEntity[];
    });
  }

  // Update existing question and its options
  async updateQuestion(
    userId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ): Promise<QuestionEntity> {
    const existing = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, quizId: true },
    });

    if (!existing || !existing.quizId) {
      throw new NotFoundException('Question not found');
    }

    await checkQuizOwnership(this.prisma, existing.quizId, userId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.options && dto.options.length > 0) {
        // Update options in-place to preserve FK references for existing attempts
        const existingOptions = await tx.option.findMany({
          where: { questionId },
          orderBy: { id: 'asc' },
        });

        for (let i = 0; i < dto.options.length; i++) {
          const optData = dto.options[i];
          if (i < existingOptions.length) {
            await tx.option.update({
              where: { id: existingOptions[i].id },
              data: {
                content: optData.content,
                isCorrect: optData.isCorrect,
              },
            });
          } else {
            await tx.option.create({
              data: {
                questionId,
                content: optData.content,
                isCorrect: optData.isCorrect,
              },
            });
          }
        }

        if (existingOptions.length > dto.options.length) {
          for (let j = dto.options.length; j < existingOptions.length; j++) {
            const optId = existingOptions[j].id;
            const refCount = await tx.quizAnswer.count({
              where: { selectedOption: optId },
            });
            if (refCount === 0) {
              await tx.option.delete({ where: { id: optId } });
            } else {
              await tx.option.update({
                where: { id: optId },
                data: { isCorrect: false },
              });
            }
          }
        }
      }

      await tx.question.update({
        where: { id: questionId },
        data: {
          ...(dto.content !== undefined && { content: dto.content }),
          ...(dto.questionType !== undefined && {
            questionType: dto.questionType,
          }),
          ...(dto.points !== undefined && { points: dto.points }),
          ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
          ...(dto.explanation !== undefined && {
            explanation: dto.explanation,
          }),
        },
      });

      const updated = await tx.question.findUnique({
        where: { id: questionId },
        include: { options: true },
      });

      if (!updated) {
        throw new NotFoundException('Updated question not found');
      }

      return updated as QuestionEntity;
    });
  }

  // Delete question and its associated options
  async deleteQuestion(
    userId: string,
    questionId: string,
  ): Promise<QuestionEntity> {
    const existing = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, quizId: true },
    });

    if (!existing || !existing.quizId) {
      throw new NotFoundException('Question not found');
    }

    await checkQuizOwnership(this.prisma, existing.quizId, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.quizAnswer.deleteMany({
        where: { questionId },
      });

      await tx.option.deleteMany({
        where: { questionId },
      });

      const deleted = await tx.question.delete({
        where: { id: questionId },
        include: { options: true },
      });

      return deleted as QuestionEntity;
    });
  }

  // Reorder questions in quiz
  async reorderQuestions(
    userId: string,
    quizId: string,
    dto: ReorderQuestionsDto,
  ): Promise<QuestionEntity[]> {
    await checkQuizOwnership(this.prisma, quizId, userId);

    return this.prisma.$transaction(async (tx) => {
      const updatePromises = dto.orders.map((item) =>
        tx.question.update({
          where: { id: item.questionId },
          data: { orderIndex: item.orderIndex },
        }),
      );

      await Promise.all(updatePromises);

      const items = await tx.question.findMany({
        where: { quizId },
        orderBy: { orderIndex: 'asc' },
        include: { options: true },
      });

      return items as QuestionEntity[];
    });
  }
}
