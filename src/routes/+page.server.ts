import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	const session = event.locals.session;
	const user = event.locals.user;

	if (!session) {
		return redirect(302, '/login');
	}

	return { session, user };
}) satisfies PageServerLoad;
