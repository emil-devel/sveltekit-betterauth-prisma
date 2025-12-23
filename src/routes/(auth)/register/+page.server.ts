import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/auth';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import { fail } from 'sveltekit-superforms';
import { redirect } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { registerSchema } from '$lib/valibot';
import { valibot } from 'sveltekit-superforms/adapters';
import { setError } from 'sveltekit-superforms';
import prisma from '$lib/prisma';

export const load = (async (event) => {
	if (event.locals.user) return redirect(302, '/');

	const form = await superValidate(valibot(registerSchema));
	return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, valibot(registerSchema));
		if (!form.valid) return fail(400, { form });

		const { username, email, password } = form.data;

		const userExist = await prisma.user.findFirst({ where: { username } });
		if (userExist) return setError(form, 'username', 'Username already taken!');

		// Check email uniqueness (previously incorrectly checked username twice)
		const emailExist = await prisma.user.findFirst({ where: { email } });
		if (emailExist) return setError(form, 'email', 'Email is already registered!');

		try {
			const passwordHash = await hash(password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			const userCount = await prisma.user.count();
			const role = userCount === 0 ? 'ADMIN' : 'USER';
			const user = await prisma.user.create({
				// Prisma client types may lag schema; cast to unblock
				data: {
					id: randomUUID(),
					username,
					email,
					passwordHash,
					role,
					active: true,
					emailVerified: role === 'ADMIN'
				}
			});

			const { token, session } = await auth.createSession(user.id);
			auth.setSessionCookie(event, token, session.expiresAt);

			throw redirect(
				303,
				'/users',
				{
					type: 'success',
					message:
						role === 'ADMIN'
							? 'Admin user created and signed in.'
							: 'Account created. Please verify your email.'
				},
				event.cookies
			);
		} catch (error) {
			console.error('Registration error:', error);
			return fail(500, { form, message: 'Could not register user.' });
		}
	}
};
