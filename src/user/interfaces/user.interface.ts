export interface IUser {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    picture?: string;
  };
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}
