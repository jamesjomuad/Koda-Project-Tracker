export const USER_ROLES = ['admin', 'member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserPayload {
  name: string;
  email: string;
  role: UserRole;
}

export interface User extends UserPayload {
  id: number;
  createdAt: string;
  updatedAt: string;
}
