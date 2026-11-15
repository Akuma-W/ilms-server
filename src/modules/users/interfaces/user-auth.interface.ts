import { UserEntity } from '../entities/user.entity';

export interface UserAuthCredentials extends UserEntity {
  password: string | null;
  googleId: string | null;
}
