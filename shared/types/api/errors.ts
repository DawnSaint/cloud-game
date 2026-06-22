export interface ISocketError {
  error: string;
}

export interface IRoomUnavailableError extends ISocketError {
  error: 'errorNotFound';
}

export interface ILoginError extends ISocketError {
  error: 'emailNotExist' | 'loginNotExist' | 'wrongPassword';
}

export interface IRegisterError extends ISocketError {
  error: 'emailAlreadyExist' | 'loginAlreadyExist';
}

export interface IUpdateEmailError extends ISocketError {
  error: 'emailAlreadyExist' | 'wrongPassword';
}

export interface IUpdateLoginError extends ISocketError {
  error: 'loginAlreadyExist' | 'wrongPassword';
}

export interface IUpdateAvatarError extends ISocketError {
  error: 'avatarNotExist' | 'avatarNotAvailable';
}

export interface IUpdatePasswordError extends ISocketError {
  error: 'wrongPassword';
}

export interface IRoomLockedError extends ISocketError {
  error: 'errorLocked';
}

export interface IRoomAlreadyInError extends ISocketError {
  error: 'errorAlreadyInRoom';
}

export interface IRoomNotInError extends ISocketError {
  error: 'errorNotInRoom';
}

export interface IRoomNotLeaderError extends ISocketError {
  error: 'errorNotLeader';
}

export type RoomError =
  | IRoomUnavailableError
  | IRoomLockedError
  | IRoomAlreadyInError
  | IRoomNotInError
  | IRoomNotLeaderError;
