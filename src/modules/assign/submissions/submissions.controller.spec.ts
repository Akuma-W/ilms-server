import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;

  const submissionsServiceMock = {
    submit: jest.fn(),
    update: jest.fn(),
    grade: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        {
          provide: SubmissionsService,
          useValue: submissionsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit an assignment', async () => {
    const dto = { textAnswer: 'My solution' };
    submissionsServiceMock.submit.mockResolvedValue({
      message: 'Submit assignment successful',
      data: { id: 'sub-1', ...dto },
    });

    const result = await controller.submit('student-1', 'assign-1', dto);
    expect(result.data.id).toBe('sub-1');
    expect(submissionsServiceMock.submit).toHaveBeenCalledWith(
      'student-1',
      'assign-1',
      dto,
    );
  });

  it('should update a submission via PUT', async () => {
    const dto = { textAnswer: 'Updated solution' };
    submissionsServiceMock.update.mockResolvedValue({
      message: 'Update submission successful',
      data: { id: 'sub-1', ...dto },
    });

    const result = await controller.update('student-1', 'sub-1', dto);
    expect(result.data.textAnswer).toBe('Updated solution');
    expect(submissionsServiceMock.update).toHaveBeenCalledWith(
      'student-1',
      'sub-1',
      dto,
    );
  });

  it('should update a submission via PATCH', async () => {
    const dto = { textAnswer: 'Patched solution' };
    submissionsServiceMock.update.mockResolvedValue({
      message: 'Update submission successful',
      data: { id: 'sub-1', ...dto },
    });

    const result = await controller.updatePatch('student-1', 'sub-1', dto);
    expect(result.data.textAnswer).toBe('Patched solution');
    expect(submissionsServiceMock.update).toHaveBeenCalledWith(
      'student-1',
      'sub-1',
      dto,
    );
  });

  it('should grade a submission', async () => {
    const dto = { score: 9.5, feedback: 'Well done' };
    submissionsServiceMock.grade.mockResolvedValue({
      message: 'Grade submission successful',
      data: { id: 'sub-1', ...dto },
    });

    const result = await controller.grade('teacher-1', 'sub-1', dto);
    expect(result.data.score).toBe(9.5);
    expect(submissionsServiceMock.grade).toHaveBeenCalledWith(
      'teacher-1',
      'sub-1',
      dto,
    );
  });

  it('should delete/cancel a submission', async () => {
    submissionsServiceMock.delete.mockResolvedValue({
      message: 'Cancel submission successful',
    });

    const result = await controller.delete('student-1', 'sub-1');
    expect(result.message).toBe('Cancel submission successful');
    expect(submissionsServiceMock.delete).toHaveBeenCalledWith(
      'student-1',
      'sub-1',
    );
  });
});
