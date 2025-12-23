import { randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';
import prisma from '$lib/prisma';
import type { RequestEvent } from '@sveltejs/kit';

const SESSION_COOKIE = 'session_token';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function generateSessionToken() {
	return randomBytes(32).toString('hex');
}

async function createSession(userId: string) {
	const token = generateSessionToken();
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

	const session = await prisma.session.create({
		data: {
			id: token,
			token,
			expiresAt,
			userId
		}
	});

	return { token, session };
}

async function deleteSession(token: string) {
	await prisma.session.deleteMany({ where: { token } });
}

function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		expires: expiresAt
	});
}

function clearSessionCookie(event: RequestEvent) {
	event.cookies.set(SESSION_COOKIE, '', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		expires: new Date(0)
	});
}

async function getSessionFromEvent(event: RequestEvent) {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const session = await prisma.session.findUnique({
		where: { token },
		include: { user: true }
	});

	if (!session) return null;
	if (session.expiresAt < new Date()) {
		await deleteSession(token);
		return null;
	}

	return session;
}

export const auth = {
	createSession,
	deleteSession,
	setSessionCookie,
	clearSessionCookie,
	getSessionFromEvent
};
