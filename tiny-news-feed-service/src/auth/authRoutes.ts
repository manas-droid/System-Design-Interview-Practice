import { Router } from 'express'
import { loginHandler, logoutHandler, refreshHandler, registerHandler } from './authController'

const router = Router()

router.post('/signup', registerHandler)
router.post('/login', loginHandler)
router.post('/refresh', refreshHandler)
router.post('/logout', logoutHandler)

export default router
