export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  password: string;
  passwordConfirmation: string;
}

export interface IRegisterErrors {
  username?: string;
  password?: string;
  passwordConfirmation?: string;
}

export interface IRegisterResponse {
  errors?: IRegisterErrors;
  user?: IUser;
}

export interface IUser {
  userId: number;
  username: string;
}
