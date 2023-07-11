import crypto from 'crypto'

const defaultUserProfile = {
  name: 'John Doe',
  email: 'john.doe@gmail.com',
  permissions: ['signin'],
}

export const buildNewUserProfile = (options) => {
  const newProfile = {
    user: { ...defaultUserProfile, uid: crypto.randomUUID(), ...options },
  }

  return newProfile
}
