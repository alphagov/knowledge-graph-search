import axios from 'axios'

const { SIGNON_URL } = process.env

export const getUserProfile = async (accessToken: string) => {
  const url = `${SIGNON_URL}/user.json`
  const { data: profile } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return profile
}
