import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as AuthUser;
    if (user?.id) {
      return Promise.resolve(user.id);
    }

    return Promise.resolve(String(req.ip));
  }
}
