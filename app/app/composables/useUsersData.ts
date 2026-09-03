import type { User } from '~/shared/types/user'

export function formatUserDisplayName(user: Pick<User, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`
}

export function getUserInitials(user: Pick<User, 'firstName' | 'lastName'>): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
}

export function filterUsersByRole(users: User[], roleName: string): User[] {
  return users.filter((u) => u.roles?.some((r) => r.roleName === roleName))
}

export function findUserByEmail(users: User[], email: string): User | undefined {
  return users.find((u) => u.email === email)
}

export function findUserByUsername(users: User[], username: string): User | undefined {
  return users.find((u) => u.username === username)
}

export function sortUsersByName(users: User[]): User[] {
  return [...users].sort((a, b) => a.firstName.localeCompare(b.firstName))
}
