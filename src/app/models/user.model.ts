export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  jmbg?: string;
  address?: string;
  idCardNumber?: string;
  issuingAuthority?: string;
}

export interface UserRequest {
  username: string;
  password: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  jmbg?: string;
  address?: string;
  idCardNumber?: string;
  issuingAuthority?: string;
}

export interface UserResponse {
  userId: number;
  username: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  profileId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  jmbg?: string;
  address?: string;
  idCardNumber?: string;
  issuingAuthority?: string;
}

// legacy — kept for backward compat with EditUserService
export class User {
  id?: number | null;
  username?: string | null;
  email?: string | null;
  password?: string | null;
  role?: string | null;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }
}
