import type { User } from '@/shared/types/user'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface UpdateProfile {
  firstName?: string
  lastName?: string
  email?: string
  username?: string
}

export interface ChangePassword {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
