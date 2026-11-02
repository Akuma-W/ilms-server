import { Test, TestingModule } from '@nestjs/testing';
import { OauthService } from './oauth.service';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';

describe('OauthService', () => {
  let service: OauthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OauthService,
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: TokenService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OauthService>(OauthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
