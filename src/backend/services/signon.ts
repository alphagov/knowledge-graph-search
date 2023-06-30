import axios from 'axios'
import config from '../config'

export const getUserProfile = async (accessToken: string) => {
  const url = `${config.signonUrl}/user.json`
  const { data: profile } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return profile
}
