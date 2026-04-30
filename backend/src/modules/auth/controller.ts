import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import { signup, login, logout, validateSession } from './service.js';

dotenv.config();

export async function postSignup(req: Request, res: Response) {
    const { username, password } = parseUser(req);

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }

    const token = await signup(username, password);

    if (token) {
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60,
        });
        return res.status(201).json({ username, message: 'Signup successful' });
    } else {
        return res.status(409).json({ error: 'User already exists' });
    }
}

export async function postLogin(req: Request, res: Response) {
    const { username, password } = parseUser(req);

    if (!username || !password) {
        return res
            .status(400)
            .json({ username, error: 'Missing username or password' });
    }

    const token = await login(username, password);

    if (token) {
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60,
        });
        return res.status(200).json({ username, message: 'Login successful' });
    } else {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
}

export async function postLogout(req: Request, res: Response) {
    await logout(req.cookies.token);
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out' });
}

export async function getValidate(req: Request, res: Response) {
    const userData = await validateSession(req.cookies.token);
    if (userData !== undefined) {
        return res
            .status(200)
            .json({ username: userData, message: 'Valid session' });
    } else {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Invalid session' });
    }
}

// TODO: Decide username and password requirements
function parseUser(req: Request) {
    const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;

    const username = req.body.username?.toString();
    const password = req.body.password?.toString();

    return usernamePattern.test(username) ? { username, password } : {};
}
