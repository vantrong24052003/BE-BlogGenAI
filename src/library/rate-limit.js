import { rateLimit } from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100000, // 100 request
  standardHeaders: 'draft-8',
  legacyHeaders: false
})
