import type { Actions, PageServerLoad } from './$types';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { redirect } from 'sveltekit-flash-message/server';
import { loginSchema } from '$lib/valibot';
import { valibot } from 'sveltekit-superforms/adapters';
import { verify } from '@node-rs/argon2';
import { auth } from '$lib/auth';
import prisma from '$lib/prisma';

export const load = (async (event) => {
	if (event.locals.user) throw redirect(302, '/');

	const form = await superValidate(valibot(loginSchema));
	return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, valibot(loginSchema));
		const { username, password } = form.data;

		if (!form.valid) return fail(400, { form });

		const user = await prisma.user.findFirst({
			where: { username },
			select: {
				id: true,
				username: true,
				email: true,
				emailVerified: true,
				passwordHash: true,
				active: true,
				role: true
			}
		});
		if (!user) {
			return setError(form, 'username', 'User does not exist!');
		}
		if (!user.active) {
			return setError(
				form,
				'username',
				'Your account has not yet been unlocked! Please contact your administrator.'
			);
		}
		if (!user.emailVerified) {
			return setError(form, 'username', 'Please verify your email before logging in.');
		}

		const validPassword = await verify(user.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return setError(form, 'password', 'Wrong password!');
		}

		try {
			const { token, session } = await auth.createSession(user.id);
			auth.setSessionCookie(event, token, session.expiresAt);
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				form,
				message: 'An error has occurred while logging the user.',
				error: String(error)
			});
		}

		throw redirect(
			303,
			'/users',
			{ type: 'info', message: 'You successfully logged in.' },
			event.cookies
		);
	}
};
