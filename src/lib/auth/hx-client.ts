import { GraphQLClient } from 'graphql-request'
import type { OtpRequestResult, OtpVerifyResult } from './types'

const HX_AUTH_GRAPHQL_URL = process.env.HX_AUTH_GRAPHQL_URL!

function createClient(authToken?: string): GraphQLClient {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  return new GraphQLClient(HX_AUTH_GRAPHQL_URL, { headers })
}

export async function introspectSchema(): Promise<unknown> {
  const client = createClient()
  const query = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        types {
          name
          kind
          fields {
            name
            args {
              name
              type { name kind ofType { name kind } }
            }
            type { name kind ofType { name kind } }
          }
        }
      }
    }
  `
  return client.request(query)
}

export async function executeQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  authToken?: string,
): Promise<T> {
  const client = createClient(authToken)
  return client.request<T>(query, variables)
}

export async function executeWithCookies<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  cookieHeader?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }

  const client = new GraphQLClient(HX_AUTH_GRAPHQL_URL, { headers })
  return client.request<T>(query, variables)
}

const OTP_DEFAULTS = {
  language: 'en',
  masterBrand: 'holidayextras',
  referrerUrl: 'https://www.holidayextras.com',
  browser: 'Chrome',
  operatingSystem: 'Unknown',
}

const GENERATE_OTP_MUTATION = `
  mutation GenerateOTP($email: String!, $language: String!, $masterBrand: String!, $referrerUrl: String!, $browser: String!, $operatingSystem: String!) {
    generateOTPCode(email: $email, language: $language, masterBrand: $masterBrand, referrerUrl: $referrerUrl, browser: $browser, operatingSystem: $operatingSystem) {
      smsError
      emailError
      smsSentToContactNumberEnding
    }
  }
`

const VERIFY_OTP_MUTATION = `
  mutation SignInWithOTP($email: String!, $otp: String!, $language: String, $masterBrand: String, $referrerUrl: String, $browser: String, $operatingSystem: String) {
    signInCustomerWithOTP(email: $email, otp: $otp, language: $language, masterBrand: $masterBrand, referrerUrl: $referrerUrl, browser: $browser, operatingSystem: $operatingSystem) {
      success
      firebaseToken
    }
  }
`

export async function requestOtp(email: string): Promise<OtpRequestResult> {
  const client = createClient()
  const data = await client.request<{ generateOTPCode: OtpRequestResult }>(
    GENERATE_OTP_MUTATION,
    { email, ...OTP_DEFAULTS },
  )
  return data.generateOTPCode
}

export async function createAccountAndSignIn(
  email: string,
  password: string,
): Promise<{ firebaseToken: string | null; cookies: string[] }> {
  // Step 1: create account with a known password
  const createRes = await fetch(HX_AUTH_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation { createCustomerAccount(userInput: { email: ${JSON.stringify(email)}, password: ${JSON.stringify(password)} }) { id } }`,
    }),
  })
  const createJson = await createRes.json()
  if (createJson.errors?.length) throw new Error(createJson.errors[0].message)

  // Step 2: sign in with email + password to get auth_session cookie
  const signInRes = await fetch(HX_AUTH_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation SignIn($email: String!, $password: String!, $language: String, $masterBrand: String, $referrerUrl: String, $browser: String, $operatingSystem: String) {
        signInCustomerWithEmailAndPassword(email: $email, password: $password, language: $language, masterBrand: $masterBrand, referrerUrl: $referrerUrl, browser: $browser, operatingSystem: $operatingSystem) {
          success firebaseToken
        }
      }`,
      variables: { email, password, ...OTP_DEFAULTS },
    }),
  })
  const signInJson = await signInRes.json()
  if (signInJson.errors?.length) throw new Error(signInJson.errors[0].message)
  const cookies = signInRes.headers.getSetCookie?.() ?? []
  return {
    firebaseToken: signInJson.data?.signInCustomerWithEmailAndPassword?.firebaseToken ?? null,
    cookies,
  }
}

export async function completeProfile(
  hxToken: string,
  profile: { givenName?: string; familyName?: string; contactNumber?: string },
): Promise<boolean> {
  const res = await fetch(HX_AUTH_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hxToken}`,
      'Cookie': `auth_session=${hxToken}`,
    },
    body: JSON.stringify({
      query: `mutation CompleteProfile($givenName: String, $familyName: String, $contactNumber: String) {
        completeRegistration(givenName: $givenName, familyName: $familyName, contactNumber: $contactNumber) {
          success
        }
      }`,
      variables: profile,
    }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data?.completeRegistration?.success ?? false
}

export async function verifyOtp(
  email: string,
  otp: string,
): Promise<{ data: OtpVerifyResult; cookies: string[] }> {
  // Use raw fetch instead of graphql-request to capture Set-Cookie headers
  const response = await fetch(HX_AUTH_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: VERIFY_OTP_MUTATION,
      variables: { email, otp, ...OTP_DEFAULTS },
    }),
  })

  const json = await response.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || 'GraphQL error during OTP verification')
  }

  const cookies = response.headers.getSetCookie?.() ?? []

  return {
    data: json.data.signInCustomerWithOTP as OtpVerifyResult,
    cookies,
  }
}
