import { getDataSource } from '~~/server/utils/db'
import { UserSchema } from '~~/server/entities/user.entity'
import { hashPassword, comparePassword } from '~~/server/utils/password'
import { signToken } from '~~/server/utils/jwt'

export const AuthService = {
  async register(data: { firstName: string; lastName: string; username: string; email: string; password: string }) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)

    const existing = await repo.findOne({ where: [{ email: data.email }, { username: data.username }] })
    if (existing) throw new Error(existing.email === data.email ? 'Email already exists' : 'Username already exists')

    const hashedPassword = await hashPassword(data.password)
    const user = repo.create({ ...data, password: hashedPassword })
    const saved = await repo.save(user)

    const token = signToken({ sub: saved.id, email: saved.email })
    const { password: _, ...userWithoutPassword } = saved
    return { accessToken: token, user: userWithoutPassword }
  },

  async login(data: { email: string; password: string }) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)

    const user = await repo.findOne({ where: { email: data.email } })
    if (!user) throw new Error('Invalid credentials')

    const valid = await comparePassword(data.password, user.password)
    if (!valid) throw new Error('Invalid credentials')

    const token = signToken({ sub: user.id, email: user.email })
    const { password: _, ...userWithoutPassword } = user
    return { accessToken: token, user: userWithoutPassword }
  },

  async getProfile(userId: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    const user = await repo.findOne({
      where: { id: userId },
      relations: {
        roles: {
          guards: true,
          permissions: {
            methods: true,
            urls: true,
          },
        },
      },
    })
    if (!user) throw new Error('User not found')
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  async updateProfile(userId: number, data: { firstName?: string; lastName?: string; email?: string; username?: string }) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    await repo.update(userId, data)
    return this.getProfile(userId)
  },

  async changePassword(userId: number, data: { currentPassword: string; newPassword: string }) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    const user = await repo.findOne({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const valid = await comparePassword(data.currentPassword, user.password)
    if (!valid) throw new Error('Current password is incorrect')

    const hashed = await hashPassword(data.newPassword)
    await repo.update(userId, { password: hashed })
    return { message: 'Password changed successfully' }
  },
}
