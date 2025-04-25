export interface IUser {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    picture?: string;
  };
  accessToken: string;
  refreshToken: string;
}
