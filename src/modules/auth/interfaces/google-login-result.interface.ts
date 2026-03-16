export type GoogleLoginResult =
  | {
      type: 'LOGIN_SUCCESS';
      message: string;
      data: {
        userId: string;
        accessToken: string;
        refreshToken: string;
      };
    }
  | {
      type: 'REGISTER_REQUIRED';
      message: string;
      data: {
        email: string;
        fullName: string;
        avatar?: string;
        tempToken: string;
      };
    };
