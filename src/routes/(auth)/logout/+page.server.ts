import { redirect } from 'sveltekit-flash-message/server';
import { auth } from '$lib/auth';

export const load = async (event) => {
	const session = await auth.getSessionFromEvent(event);
	if (session) {
		await auth.deleteSession(session.token);
		auth.clearSessionCookie(event);
	}

	throw redirect(303, '/login', { type: 'info', message: 'Logged out.' }, event.cookies);
};
