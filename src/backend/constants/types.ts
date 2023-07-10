export type SignonProfileData = {
  user: {
    uid: string
    name: string
    email: string
    permissions: {
      [key: string]: string[]
    }
  }
}
