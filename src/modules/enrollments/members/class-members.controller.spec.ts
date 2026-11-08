import { Test, TestingModule } from '@nestjs/testing';
import { ClassMembersController } from './class-members.controller';
import { ClassMembersService } from './class-members.service';
import { Role } from 'src/generated/prisma/enums';

describe('ClassMembersController', () => {
  let controller: ClassMembersController;
  let serviceMock: {
    getMembers: jest.Mock;
    approveMember: jest.Mock;
    rejectMember: jest.Mock;
    removeMember: jest.Mock;
    updateMemberRole: jest.Mock;
  };

  beforeEach(async () => {
    serviceMock = {
      getMembers: jest.fn(),
      approveMember: jest.fn(),
      rejectMember: jest.fn(),
      removeMember: jest.fn(),
      updateMemberRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassMembersController],
      providers: [
        {
          provide: ClassMembersService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ClassMembersController>(ClassMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return class members', async () => {
    serviceMock.getMembers.mockResolvedValue([]);
    const result = await controller.getMembers('user-uuid', 'class-uuid');
    expect(result.message).toBe('Get class members successful');
    expect(result.data).toEqual([]);
    expect(serviceMock.getMembers).toHaveBeenCalledWith(
      'user-uuid',
      'class-uuid',
    );
  });

  it('should approve a member', async () => {
    serviceMock.approveMember.mockResolvedValue({
      message: 'Approve enrollment successful',
      data: { id: 'en-uuid' },
    });
    const result = await controller.approveMember(
      'teacher-uuid',
      'class-uuid',
      'en-uuid',
    );
    expect(result.message).toBe('Approve enrollment successful');
  });

  it('should reject a member', async () => {
    serviceMock.rejectMember.mockResolvedValue({
      message: 'Reject enrollment successful',
      data: { id: 'en-uuid' },
    });
    const result = await controller.rejectMember(
      'teacher-uuid',
      'class-uuid',
      'en-uuid',
    );
    expect(result.message).toBe('Reject enrollment successful');
  });

  it('should remove a member', async () => {
    serviceMock.removeMember.mockResolvedValue({
      message: 'Remove member successful',
    });
    const result = await controller.removeMember(
      'teacher-uuid',
      'class-uuid',
      'en-uuid',
    );
    expect(result.message).toBe('Remove member successful');
  });

  it('should update member role', async () => {
    serviceMock.updateMemberRole.mockResolvedValue({
      message: 'Update member role successful',
      data: { id: 'en-uuid', roleIn: Role.teacher },
    });
    const result = await controller.updateMemberRole(
      'teacher-uuid',
      'class-uuid',
      'en-uuid',
      { role: Role.teacher },
    );
    expect(result.message).toBe('Update member role successful');
  });
});
