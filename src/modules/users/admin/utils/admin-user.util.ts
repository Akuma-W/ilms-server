import { UserEntity } from 'src/modules/users/entities/user.entity';

// Formats admin user summary view
export function sanitizeAdminUser(user: UserEntity): UserEntity {
  return {
    ...user,
    fullName: user.fullName?.trim(),
  };
}
