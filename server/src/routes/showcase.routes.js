import { Router } from 'express'
import { getPublicShowcase } from '../services/showcase.js'

const router = Router()

router.get('/current', async (_req, res, next) => {
  try { res.json(await getPublicShowcase()) }
  catch (error) { next(error) }
})

export default router
