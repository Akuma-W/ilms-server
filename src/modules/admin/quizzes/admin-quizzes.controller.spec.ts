import { Test, TestingModule } from '@nestjs/testing';
import { QuizStatus, ReviewMode, Visibility } from 'src/generated/prisma/enums';
import { AdminQuizzesController } from './admin-quizzes.controller';
import { AdminQuizzesService } from './admin-quizzes.service';

describe('AdminQuizzesController', () => {
  let controller: AdminQuizzesController;

  const mockQuizzesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    takedown: jest.fn(),
    forceDelete: jest.fn(),
  };

  const mockQuiz = {
    id: 'quiz-1',
    title: 'Midterm Exam',
    description: 'Sample description',
    timeLimit: 45,
    visibility: Visibility.public,
    status: QuizStatus.published,
    reviewMode: ReviewMode.after_submission,
    totalQuestions: 20,
    totalAttempts: 150,
    creator: {
      id: 'u-1',
      fullName: 'Teacher A',
      email: 'teacher@edu.vn',
      avatarUrl: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminQuizzesController],
      providers: [
        { provide: AdminQuizzesService, useValue: mockQuizzesService },
      ],
    }).compile();

    controller = module.get<AdminQuizzesController>(AdminQuizzesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should delegate to service', async () => {
    const paginatedResult = {
      data: [mockQuiz],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    mockQuizzesService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll({ page: 1, limit: 10 });
    expect(result.data.data).toHaveLength(1);
    expect(mockQuizzesService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('takedown should delegate to service', async () => {
    mockQuizzesService.takedown.mockResolvedValue({
      ...mockQuiz,
      visibility: Visibility.private,
      status: QuizStatus.draft,
    });

    const result = await controller.takedown('quiz-1', {
      reason: 'Copyright violation',
    });
    expect(result.data.visibility).toBe(Visibility.private);
    expect(mockQuizzesService.takedown).toHaveBeenCalledWith('quiz-1', {
      reason: 'Copyright violation',
    });
  });

  it('remove should delegate to service', async () => {
    mockQuizzesService.forceDelete.mockResolvedValue({
      success: true,
      message: 'Quiz deleted successfully',
    });

    const result = await controller.remove('quiz-1');
    expect(result.message).toBe('Quiz deleted successfully');
    expect(mockQuizzesService.forceDelete).toHaveBeenCalledWith('quiz-1');
  });
});
