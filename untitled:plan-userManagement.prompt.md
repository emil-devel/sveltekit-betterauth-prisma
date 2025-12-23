## Plan: Better-Auth User Management

Implement cohesive auth flows using Better-Auth with Superforms/Valibot, aligning Prisma schema and SvelteKit hooks. Cover register, login, logout, and protected dashboard pages with consistent validation, session handling, and UI feedback.

### Steps

1. Reconcile Prisma User/Session fields with Better-Auth expectations in prisma/schema.prisma (add `role`, `active` fields; ensure defaults) and regenerate client if needed.
2. Confirm Better-Auth server/client config and hooks in src/lib/auth.ts and src/hooks.server.ts expose session, `locals.auth`, and cookies consistently.
3. Complete register action using Superforms/Valibot in src/routes/(auth)/register/+page.server.ts: validate, hash, create user, start session, redirect with flash.
4. Refactor login action in src/routes/(auth)/login/+page.server.ts to rely on Better-Auth APIs (or align schema) and keep Superforms/Valibot validation + flash redirects.
5. Implement logout handler in src/routes/(auth)/logout/+page.server.ts to clear session via Better-Auth and redirect.
6. Add protected dashboard/user management flows in src/routes/(dash)/users/+page.server.ts with access control (only admins can change role/active), list/create/update users via Prisma, and surface Superforms + toasts.

### Further Considerations

1. Roles/permissions and editability:
   - `role` (USER/ADMIN) and `active` flags on User; only admins can change these fields.
   - Regular users cannot edit their accounts (no self-service yet).
   - First registered user becomes ADMIN; subsequent users default to USER.

2. Password policy, email verification, OAuth:
   - Use registerSchema in src/lib/valibot/index.ts for password rules.
   - Use Better-Auth built-in email link verification (SEND*MAIL* env ready);
   - OAuth planned later (none now).

3. Redirect UX:
   - Redirect auth success to /(dash)/users for now (only protected area).
