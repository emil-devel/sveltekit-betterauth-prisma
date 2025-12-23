import { auth } from '$lib/auth';

export async function handle({ event, resolve }) {
	const session = await auth.getSessionFromEvent(event);

	if (session) {
		event.locals.session = {
			id: session.id,
			expiresAt: session.expiresAt
		};
		event.locals.user = session.user;
	}

	return resolve(event);
}
