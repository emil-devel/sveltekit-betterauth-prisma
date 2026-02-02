import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { activeUserSchema, roleUserSchema, userIdSchema, userEmailSchema } from '$lib/valibot';

export const load = (async (event) => {
	const viewer = event.locals.authUser;
	if (!viewer) throw redirect(302, '/sign-in');

	const getUser = async (name: string) => {
		// Single round-trip: user + profile via LEFT JOIN (profile expected to exist, but we guard anyway)
		const user = await prisma.user.findUnique({
			where: { name },
			include: { profileByName: true }
		});
		if (!user) throw redirect(302, '/users');
		if (!user.profileByName?.id) throw redirect(302, '/users'); // invariant: profile should exist

		const { id, updatedAt, createdAt } = user;

		const [emailForm, activeForm, roleForm, deleteForm] = await Promise.all([
			superValidate(
				{ id, emailPublic: user.emailPublic as string | undefined },
				valibot(userEmailSchema)
			),
			superValidate({ id, active: user.active }, valibot(activeUserSchema)),
			superValidate({ id, role: user.role }, valibot(roleUserSchema)),
			superValidate({ id }, valibot(userIdSchema))
		]);

		return {
			id,
			name: user.name,
			image: user.image,
			email: user.email,
			emailVerified: user.emailVerified,
			emailForm,
			activeForm,
			roleForm,
			deleteForm,
			updatedAt: updatedAt.toLocaleDateString(),
			createdAt: createdAt.toLocaleDateString(),
			avatar: user.profileByName?.avatar ?? null,
			firstName: user.profileByName?.firstName ?? null,
			lastName: user.profileByName?.lastName ?? null
		};
	};

	return await getUser(event.params.name);
}) satisfies PageServerLoad;

export const actions: Actions = {
	email: async (event) => {
		const emailForm = await superValidate(event.request, valibot(userEmailSchema));
		const { id, emailPublic } = emailForm.data;

		if (!emailForm.valid) return fail(400, { emailForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');

		if (viewer.id !== id)
			return setFlash({ type: 'error', message: 'Not authorized.' }, event.cookies);

		const res = emailPublic
			? await prisma.profile.findFirst({
					where: { emailPublic, NOT: { userId: id } },
					select: { emailPublic: true }
				})
			: null;

		if (emailPublic && emailPublic === res?.emailPublic)
			return setError(emailForm, 'emailPublic', 'Email already in use!');

		try {
			await prisma.profile.update({
				where: { userId: id },
				data: { emailPublic: emailPublic ?? null }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		const message = emailPublic ? `Public email set to "${emailPublic}".` : 'Public email removed.';
		setFlash({ type: 'success', message }, event.cookies);
	},
	active: async (event) => {
		const activeForm = await superValidate(event.request, valibot(activeUserSchema));
		const { id, active } = activeForm.data;

		if (!activeForm.valid) return fail(400, { activeForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');
		if (viewer.role !== 'ADMIN')
			return setFlash({ type: 'error', message: 'Not authorized.' }, event.cookies);

		try {
			await prisma.user.update({
				where: { id: id as string },
				data: { active: active as boolean }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		const message = active ? 'User activated.' : 'User deactivated.';
		setFlash({ type: 'success', message }, event.cookies);
	},
	role: async (event) => {
		const roleForm = await superValidate(event.request, valibot(roleUserSchema));
		const { id, role } = roleForm.data;

		if (!roleForm.valid) return fail(400, { roleForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');
		if (viewer.role !== 'ADMIN')
			return setFlash({ type: 'error', message: 'Not authorized.' }, event.cookies);

		try {
			await prisma.user.update({
				where: { id: id as string },
				data: { role: role }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		const message = `User role set to "${role}".`;
		setFlash({ type: 'success', message }, event.cookies);
	},
	delete: async (event) => {
		const deleteForm = await superValidate(event.request, valibot(userIdSchema));
		const { id } = deleteForm.data;

		if (!deleteForm.valid) return fail(400, { deleteForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');
		if (viewer.role !== 'ADMIN')
			return setFlash({ type: 'error', message: 'Not authorized.' }, event.cookies);

		try {
			await prisma.user.delete({ where: { id: id as string } });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		redirect('/users', { type: 'success', message: 'User deleted successfully.' }, event.cookies);
	}
};
