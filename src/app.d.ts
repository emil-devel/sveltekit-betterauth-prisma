// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface Locals {
			session?: { id: string; expiresAt: Date };
			user?: typeof import('./lib/auth').auth.$Infer.User;
			authUser?: import('./lib/permissions').AuthUser | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
