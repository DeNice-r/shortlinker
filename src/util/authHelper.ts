import { genSalt, hash } from 'bcryptjs'
import process from 'process'
import jwt from 'jsonwebtoken'
import { put } from '../dynamodb/tokens'

export async function generateHash (password: string) {
    const SALT_ROUNDS = +(process.env.SALT_ROUNDS || 12)
    return await hash(password, await genSalt(SALT_ROUNDS))
}

export function generateAccessToken (userId: string) {
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET

    const ACCESS_TOKEN_TTL_SECONDS = process.env.ACCESS_TOKEN_TTL_SECONDS || 3600
    return jwt.sign({id: userId}, JWT_ACCESS_SECRET, {expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s`})
}

export function generateRefreshToken (userId: string) {
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
    const REFRESH_TOKEN_TTL_SECONDS = process.env.REFRESH_TOKEN_TTL_SECONDS

    return jwt.sign({id: userId}, JWT_REFRESH_SECRET, {expiresIn: `${REFRESH_TOKEN_TTL_SECONDS}s`})
}

export async function generateTokens (userId: string) {
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

    const tokens = {
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId)
    }

    await Promise.all([
        put(tokens.accessToken, jwt.verify(tokens.accessToken, JWT_ACCESS_SECRET)),
        put(tokens.refreshToken, jwt.verify(tokens.refreshToken, JWT_REFRESH_SECRET))
    ])

    return tokens
}

export function getCredentialsIfValid (body: string) {
    let bodyJson: any
    try {
        bodyJson = JSON.parse(body)
    } catch (e) {
        throw new Error('Request body unprocessable')
    }
    const {email, password} = bodyJson
    if (!email || !password) {
        throw new Error('No email or password provided')
    }

    if (!(isEmailValid(email) && isPasswordValid(password))) {
        throw new Error('Invalid credentials')
    }

    return {email, password}
}

export function isEmailValid (email: string) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
    return emailRegex.test(email)
}

export function isPasswordValid (password: string) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,100}$/
    return passwordRegex.test(password)
}
