export interface PublicUserProfile {
  id: string;
  name: string;
  avatar: string;
}

export interface UserForUI extends PublicUserProfile {
  email: string;
  login: string;
}

export interface UserWithToken extends UserForUI {
  token: string;
}

export interface UserProfile extends UserForUI {
  registrationDate: string;
  password: string;
}
