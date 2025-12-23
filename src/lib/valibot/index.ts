import {
	object,
	string,
	pipe,
	minLength,
	regex,
	toLowerCase,
	trim,
	email,
	check,
	maxLength
} from 'valibot';

export const registerSchema = pipe(
	object({
		username: pipe(
			string(),
			minLength(4, 'Username must be at least 4 characters long'),
			maxLength(12, 'Username must be at most 12 characters long'),
			trim(),
			// 1. Allowed characters only
			regex(
				/^[a-z0-9._]+$/,
				'Username can only contain lowercase letters, numbers, dots and underscores'
			),
			// 2. No consecutive dots or underscores anywhere
			regex(/^(?!.*[_.]{2}).*$/, 'Username cannot contain consecutive dots or underscores'),
			// 3. Cannot start with specific characters (split for tailored messages)
			regex(/^(?![0-9]).*$/, 'Username cannot start with a number'),
			regex(/^(?!_).*/, 'Username cannot start with an underscore'),
			regex(/^(?!\.).*/, 'Username cannot start with a dot'),
			toLowerCase()
		),
		email: pipe(string(), email(), trim(), toLowerCase()),
		password: pipe(
			string(),
			minLength(8, 'Password must be at least 8 characters long'),
			regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),
			regex(/[a-z]/, 'Password must contain at least one lowercase letter'),
			regex(/[0-9]/, 'Password must contain at least one number'),
			regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
		),
		passwordConfirm: string()
	}),
	check((c) => c.passwordConfirm === c.password, 'Passwords dont match')
);

export const loginSchema = pipe(
	object({
		username: pipe(string(), trim()),
		password: string()
	})
);
