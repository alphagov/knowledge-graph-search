export type SignonProfileData = {
  user: {
    uid: string
    name: string
    email: string
    permissions: {
      [key: string]: string[]
    }
    remotely_signed_out: boolean
    organisation_slug: string
    disable: boolean
    organisation_content_id: string
  }
}

export type SignonProfile = {
  accessToken: string
  profileData: SignonProfileData
  refreshToken: string
}
