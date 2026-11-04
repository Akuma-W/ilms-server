export type GoogleLoginResult =
  | {
      action: 'LOGIN';
      data: {
        userId: string;
        accessToken: string;
        refreshToken: string;
      };
    }
  | {
      action: 'REGISTER_REQUIRED';
      data: {
        email: string;
        fullName: string;
        avatar?: string;
        tempToken: string;
      };
    };
