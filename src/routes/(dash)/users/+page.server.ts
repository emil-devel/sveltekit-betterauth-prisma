import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';

export const load = (async (event) => {
	const user = event.locals.user;
	if (!user) throw redirect(302, '/login');
	if (user.role !== 'ADMIN') throw error(403, 'Admins only');

	const users = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			email: true,
			emailVerified: true,
			role: true,
			active: true,
			createdAt: true
		},
		orderBy: { username: 'asc' }
	});

	return { users };
}) satisfies PageServerLoad;
