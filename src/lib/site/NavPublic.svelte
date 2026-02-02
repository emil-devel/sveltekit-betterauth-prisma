<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	type PublicPages = {
		title: string;
		route: '/(public)/test-1' | '/(public)/test-2';
	};

	const publicPages: PublicPages[] = [
		{
			title: 'Page One',
			route: '/(public)/test-1'
		},
		{
			title: 'Page Two',
			route: '/(public)/test-2'
		}
	];
</script>

{#each publicPages as item, i (i)}
	<li>
		<a
			class="btn preset-outlined-primary-200-800 btn-sm hover:preset-filled-primary-200-800"
			class:preset-filled-primary-200-800={page.url.pathname === resolve(item.route)}
			class:preset-tonal-primary={page.url.pathname.includes(resolve(item.route))}
			aria-current={page.url.pathname === resolve(item.route)}
			href={resolve(item.route)}
		>
			<span>{item.title}</span>
		</a>
	</li>
{/each}
