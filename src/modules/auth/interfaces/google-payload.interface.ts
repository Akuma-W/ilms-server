export interface GooglePayload {
  type: 'GOOGLE_REGISTER';
  email: string;
  googleId: string;
  avatar?: string;
  fullName: string;
}
