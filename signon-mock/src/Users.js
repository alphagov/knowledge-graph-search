import crypto from 'crypto'

export const ADMIN_ACCESS_TOKEN = 'admin-access-token'

const DEFAULT_USER = {
  id: crypto.randomUUID(),
  name: 'John Doe',
  accessToken: crypto.randomUUID(),
  permissions: ['signin'],
}
const ADMIN_USER = {
  id: crypto.randomUUID(),
  name: 'Admin',
  accessToken: ADMIN_ACCESS_TOKEN,
  permissions: ['signin', 'user_update_permission'],
}

class Users {
  constructor() {
    this.users = [DEFAULT_USER, ADMIN_USER]
  }

  addUser(name) {
    const id = crypto.randomUUID()
    const user = { id, name }
    this.users.push(user)
    return user
  }

  getUser(id) {
    return this.users.find((user) => user.id === id)
  }

  getUserByAccessToken(accessToken) {
    return this.users.find((user) => user.accessToken === accessToken)
  }

  getUserByAuthorizationCode(authorizationCode) {
    return this.users.find(
      (user) => user.authorizationCode === authorizationCode
    )
  }

  createUser() {
    const shortId = crypto.randomUUID().split('-')[0]
    const newUser = {
      id: crypto.randomUUID(),
      name: `New User ${shortId}`,
      permissions: [],
      authorizationCode: crypto.randomUUID(),
    }
    this.users.push(newUser)
    return newUser
  }

  updateUser(id, newUser) {
    if (!!newUser.id) {
      throw new Error('Cannot update id')
    }
    const user = this.getUser(id)
    if (!user) {
      throw new Error(`User with id ${id} not found`)
    }
    const updatedUser = { ...user, ...newUser }
    this.users = this.users.map((user) => (user.id === id ? updatedUser : user))
    return updatedUser
  }
}

export default new Users()
