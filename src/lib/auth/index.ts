export type { AuthUser, AuthCookie, SignInResult, SessionData, OtpRequestResult, OtpVerifyResult } from './types'
export { introspectSchema, executeQuery, executeWithCookies, requestOtp, verifyOtp, createAccountAndSignIn, completeProfile } from './hx-client'
export { signInWithEmailHash, redeemSingleUseToken } from './hx-rest-client'
export {
  createSession,
  getSession,
  getSessionCookieName,
  sessionCookieOptions,
  clearSessionCookieOptions,
} from './session'
