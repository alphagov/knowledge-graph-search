import type express from 'express'
import crypto from 'crypto'
import { addSessionToUserSet } from '../services/redisStore'

export function generateSessionId(req: express.Request) {
  const sessionId = crypto.randomUUID()

  // If the request has the user profile, then record the Signon userId
  // against the sessionId for lookup when destroying sessions through the
  // /reauth endpoint.
  if (req.user) {
    const { uid: userId } = (req.user as any).profileData
    addSessionToUserSet(userId, sessionId)
  }

  return sessionId
}
