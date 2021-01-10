export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  displayName: string;
  password: string;
  passwordConfirmation: string;
}

export interface IRegisterErrors {
  username?: string;
  displayName?: string;
  password?: string;
  passwordConfirmation?: string;
}

export interface IUser {
  userId: number;
  username: string;
  displayName: string;
}
