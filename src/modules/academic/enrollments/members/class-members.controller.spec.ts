import { Test, TestingModule } from '@nestjs/testing';
import { ClassMembersController } from './class-members.controller';
import { ClassMembersService } from './class-members.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';

describe('ClassMembersController', () => {
  let controller: ClassMembersController;
  const serviceMock = {
    getMembers: jest.fn(),
    addAssistant: jest.fn(),
    approveMember: jest.fn(),
    rejectMember: jest.fn(),
    reApproveMember: jest.fn(),
    banMember: jest.fn(),
    unbanMember: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
  };

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassMembersController],
      providers: [
        {
          provide: ClassMembersService,
          useValue: serviceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<ClassMembersController>(ClassMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add an assistant', async () => {
    serviceMock.addAssistant.mockResolvedValue({
      message: 'Assistant teacher added successfully',
      data: { id: 'en-uuid' },
    });
    const mockAuthUser: AuthUser = {
      id: 'teacher-uuid',
      role: Role.teacher,
      jti: 'jti-1',
      exp: 999999999,
    };
    const result = await controller.addAssistant(
      'class-uuid',
      { userId: 'user-uuid' },
      mockAuthUser,
    );
    expect(result.message).toBe('Assistant teacher added successfully');
    expect(serviceMock.addAssistant).toHaveBeenCalledWith(
      'class-uuid',
      'user-uuid',
      'teacher-uuid',
      Role.teacher,
    );
  });

  it('should return class members', async () => {
    serviceMock.getMembers.mockResolvedValue([]);
    const result = await controller.getMembers('class-uuid');
    expect(result.message).toBe('Get class members successful');
    expect(result.data).toEqual([]);
    expect(serviceMock.getMembers).toHaveBeenCalledWith('class-uuid');
  });

  it('should approve a member', async () => {
    serviceMock.approveMember.mockResolvedValue({
      message: 'Approve enrollment successful',
      data: { id: 'en-uuid' },
    });
    const result = await controller.approveMember('class-uuid', 'en-uuid');
    expect(result.message).toBe('Approve enrollment successful');
  });

  it('should reject a member', async () => {
    serviceMock.rejectMember.mockResolvedValue({
      message: 'Reject enrollment successful',
      data: { id: 'en-uuid' },
    });
    const result = await controller.rejectMember('class-uuid', 'en-uuid');
    expect(result.message).toBe('Reject enrollment successful');
  });

  it('should re-approve a member', async () => {
    serviceMock.reApproveMember.mockResolvedValue({
      message: 'Member re-approved successfully',
      data: { id: 'en-uuid' },
    });
    const result = await controller.reApproveMember('class-uuid', 'en-uuid');
    expect(result.message).toBe('Member re-approved successfully');
  });

  it('should ban a member', async () => {
    serviceMock.banMember.mockResolvedValue({
      message: 'Member suspended successfully',
      data: { id: 'en-uuid' },
    });
    const result = await controller.banMember('class-uuid', 'en-uuid');
    expect(result.message).toBe('Member suspended successfully');
  });

  it('should unban a member', async () => {
    serviceMock.unbanMember.mockResolvedValue({
      message: 'Member suspension lifted successfully',
      data: { id: 'en-uuid' },
    });
    const result = await controller.unbanMember('class-uuid', 'en-uuid');
    expect(result.message).toBe('Member suspension lifted successfully');
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
    const result = await controller.updateMemberRole('class-uuid', 'en-uuid', {
      role: Role.teacher,
    });
    expect(result.message).toBe('Update member role successful');
  });
});
