import type { Actions, PageServerLoad } from './$types';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { isAdmin, isSelf } from '$lib/permissions';
import { sanitizeFormData } from '$lib/sanitizer';
import prisma from '$lib/prisma';
import { fail, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import {
	profileAvatarSchema,
	profileFirstNameSchema,
	profileLastNameSchema,
	profilePhoneSchema,
	profileBioSchema
} from '$lib/valibot';

export const load = (async (event) => {
	if (!event.locals.authUser) throw redirect(302, '/sign-in');
	const getProfile = async (name: string) => {
		const profile = await prisma.profile.findUnique({
			where: { name }
		});
		if (!profile) throw redirect(302, '/users');
		// View policy: Users may view only their own profile; Admins may view any profile
		const viewer = event.locals.authUser;
		if (!viewer || !(isAdmin(viewer) || isSelf(viewer.id, profile.userId)))
			throw redirect(302, '/users');
		// Create forms
		const [avatarForm, firstNameForm, lastNameForm, phoneForm, bioForm] = await Promise.all([
			superValidate(
				{ id: profile.id, avatar: profile.avatar as string | undefined },
				valibot(profileAvatarSchema)
			),
			superValidate(
				{ id: profile.id, firstName: profile.firstName as string | undefined },
				valibot(profileFirstNameSchema)
			),
			superValidate(
				{ id: profile.id, lastName: profile.lastName as string | undefined },
				valibot(profileLastNameSchema)
			),
			superValidate(
				{ id: profile.id, phone: profile.phone as string | undefined },
				valibot(profilePhoneSchema)
			),
			superValidate(
				{ id: profile.id, bio: profile.bio as string | undefined },
				valibot(profileBioSchema)
			)
		]);

		return {
			id: profile.id,
			name: profile.name,
			userId: profile.userId,
			avatarForm,
			firstNameForm,
			lastNameForm,
			phoneForm,
			bioForm
		};
	};

	return await getProfile(event.params.name);
}) satisfies PageServerLoad;

export const actions: Actions = {
	avatar: async (event) => {
		const avatarForm = await superValidate(event.request, valibot(profileAvatarSchema));
		if (!avatarForm.valid) return fail(400, { avatarForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');

		const { id } = avatarForm.data;
		const avatar = avatarForm.data.avatar === '' ? null : avatarForm.data.avatar;

		try {
			await prisma.profile.update({
				where: { id },
				data: { avatar }
			});
		} catch (error) {
			return setFlash(
				{ type: 'error', message: error instanceof Error ? error.message : String(error) },
				event.cookies
			);
		}

		setFlash(
			{
				type: 'success',
				message: `Avatar ${avatarForm.data.avatar === '' ? 'deleted' : 'updated'}.`
			},
			event.cookies
		);
	},
	firstName: async (event) => {
		const formData = await event.request.formData();
		const data = sanitizeFormData(formData, { lowercase: [] }) as Record<string, unknown>;

		const firstNameValue = typeof data.firstName === 'string' ? data.firstName.trim() : undefined;
		data.firstName = firstNameValue === '' ? undefined : firstNameValue;

		const firstNameForm = await superValidate(data, valibot(profileFirstNameSchema));
		if (!firstNameForm.valid) return fail(400, { firstNameForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');

		const { id, firstName } = firstNameForm.data;

		try {
			await prisma.profile.updateMany({
				where: { id, userId: viewer.id },
				data: { firstName: firstName ?? null }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		setFlash({ type: 'success', message: `First name set to "${firstName}".` }, event.cookies);
	},
	lastName: async (event) => {
		const formData = await event.request.formData();
		const data = sanitizeFormData(formData, { lowercase: [] }) as Record<string, unknown>;

		const lastNameValue = typeof data.lastName === 'string' ? data.lastName.trim() : undefined;
		data.lastName = lastNameValue === '' ? undefined : lastNameValue;

		const lastNameForm = await superValidate(data, valibot(profileLastNameSchema));
		if (!lastNameForm.valid) return fail(400, { lastNameForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');

		const { id, lastName } = lastNameForm.data;

		try {
			await prisma.profile.updateMany({
				where: { id, userId: viewer.id },
				data: { lastName: lastName ?? null }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		setFlash({ type: 'success', message: `Last name set to "${lastName}".` }, event.cookies);
	},
	phone: async (event) => {
		const formData = await event.request.formData();
		const data = sanitizeFormData(formData, { lowercase: [] }) as Record<string, unknown>;

		const phoneValue = typeof data.phone === 'string' ? data.phone.trim() : undefined;
		data.phone = phoneValue === '' ? undefined : phoneValue;

		const phoneForm = await superValidate(data, valibot(profilePhoneSchema));
		if (!phoneForm.valid) return fail(400, { phoneForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');

		const { id, phone } = phoneForm.data;

		try {
			await prisma.profile.updateMany({
				where: { id, userId: viewer.id },
				data: { phone: phone ?? null }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		setFlash({ type: 'success', message: 'Phone updated.' }, event.cookies);
	},
	bio: async (event) => {
		const bioForm = await superValidate(event.request, valibot(profileBioSchema));
		if (!bioForm.valid) return fail(400, { bioForm });

		const viewer = event.locals.authUser;
		if (!viewer) throw redirect(302, '/sign-in');

		const { id, bio } = bioForm.data;

		try {
			await prisma.profile.updateMany({
				where: { id, userId: viewer.id },
				data: { bio: bio ?? null }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return setFlash({ type: 'error', message }, event.cookies);
		}

		setFlash({ type: 'success', message: 'Bio updated successfully.' }, event.cookies);
	}
};
