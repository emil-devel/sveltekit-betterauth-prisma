import type { PageServerLoad } from './$types';
import { redirect } from 'sveltekit-flash-message/server';
import prisma from '$lib/prisma';

export const load = (async (event) => {
	if (!event.locals.authUser) throw redirect(302, '/sign-in');

	const getUsers = async () => {
		const result = await prisma.user.findMany({
			orderBy: { name: 'asc' },
			include: { profile: true }
		});

		const users = result.map((user) => ({
			id: user.id,
			active: user.active,
			role: user.role,
			name: user.name,
			createdAt: user.createdAt.toLocaleDateString(),
			image: user.image,
			avatar: user.profile?.avatar ?? null,
			firstName: user.profile?.firstName ?? null,
			lastName: user.profile?.lastName ?? null
		}));

		return users;
	};

	return {
		users: await getUsers()
	};
}) satisfies PageServerLoad;
