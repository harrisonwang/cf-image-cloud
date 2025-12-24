import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET_KEY = 'JWT_SECRET'
const TOKEN_EXPIRY = '7d' // 7 days

export async function generateToken(username: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey)

  return token
}

export async function verifyToken(token: string, secret: string): Promise<{ username: string } | null> {
  try {
    const encoder = new TextEncoder()
    const secretKey = encoder.encode(secret)

    const { payload } = await jwtVerify(token, secretKey)
    return payload as { username: string }
  } catch (error) {
    return null
  }
}
