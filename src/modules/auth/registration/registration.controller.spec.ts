import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { Role } from 'src/generated/prisma/enums';

describe('RegistrationController', () => {
  let controller: RegistrationController;
  let registrationService: {
    register: jest.Mock;
    verifyRegistrationOtp: jest.Mock;
    resendRegistrationOtp: jest.Mock;
  };

  beforeEach(async () => {
    registrationService = {
      register: jest.fn(),
      verifyRegistrationOtp: jest.fn(),
      resendRegistrationOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [
        { provide: RegistrationService, useValue: registrationService },
      ],
    }).compile();

    controller = module.get<RegistrationController>(RegistrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should delegate to registrationService.register', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password@123',
        fullName: 'Test User',
        role: Role.student,
        schoolId: 'school-id',
        identityCode: 'SV123',
      };
      registrationService.register.mockResolvedValueOnce({
        message: 'OTP sent successfully',
      });

      const result = await controller.register(dto);

      expect(result).toEqual({
        message: 'OTP sent successfully',
        data: null,
      });
      expect(registrationService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyRegistrationOtp', () => {
    it('should delegate to registrationService.verifyRegistrationOtp', async () => {
      const dto = { email: 'test@example.com', otp: '123456' };
      registrationService.verifyRegistrationOtp.mockResolvedValueOnce({
        userId: 'user-id',
      });

      const result = await controller.verifyRegistrationOtp(dto);

      expect(result).toEqual({
        message: 'User registered successfully',
        data: { userId: 'user-id' },
      });
      expect(registrationService.verifyRegistrationOtp).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('resendRegistrationOtp', () => {
    it('should delegate to registrationService.resendRegistrationOtp', async () => {
      const dto = { email: 'test@example.com' };
      registrationService.resendRegistrationOtp.mockResolvedValueOnce({
        message: 'Registration OTP resent successfully',
      });

      const result = await controller.resendRegistrationOtp(dto);

      expect(result).toEqual({
        message: 'Registration OTP resent successfully',
        data: null,
      });
      expect(registrationService.resendRegistrationOtp).toHaveBeenCalledWith(
        dto,
      );
    });
  });
});
