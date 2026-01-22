import type { Actions, PageServerLoad } from './$types';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/auth';
import { registerSchema } from '$lib/valibot';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { redirect } from 'sveltekit-flash-message/server';
import prisma from '$lib/prisma';
import { sanitizeFormData } from '$lib/sanitizer';

export const load = (async () => {
	const form = await superValidate(valibot(registerSchema));
	return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const data = sanitizeFormData(formData, { lowercase: ['email', 'name', 'image'] });
		const form = await superValidate(data, valibot(registerSchema));
		const { name, email, password, passwordConfirm } = form.data;
		let image: string | undefined;

		if (!form.valid) return fail(400, { form });

		if (passwordConfirm !== password) {
			return setError(form, 'passwordConfirm', 'Passwords dont match');
		}

		const userExists = await prisma.user.findUnique({ where: { name } });
		if (userExists) return setError(form, 'name', 'Username already exist!');

		const emailExist = await prisma.user.findUnique({ where: { email } });
		if (emailExist) return setError(form, 'email', 'Email already in use!');

		try {
			const res = await auth.api.signUpEmail({
				body: { name, email, password, image }
			});

			const userId = res?.user?.id;
			if (!userId) {
				return fail(500, {
					form,
					message: 'User was created, but profile could not be initialized.'
				});
			}

			await prisma.profile.upsert({
				where: { userId },
				update: { name },
				create: { userId, name }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(500, {
					form,
					message: 'An error has occurred while creating the user.',
					error: String(error)
				});
			}

			throw error;
		}

		throw redirect(
			303,
			'/',
			{
				type: 'success',
				message: 'You are now registered and need to verify your email before logging in.'
			},
			event
		);
	}
};
