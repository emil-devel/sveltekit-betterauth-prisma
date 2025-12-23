<script lang="ts">
	import type { PageProps } from './$types';

	let props: PageProps = $props();
	let data = $state(props.data);

	let { users } = data;
</script>

<ul>
	{#each users as user (user.id)}
		<li>
			<h3 class="h4">{user.username}</h3>
			<p>Role: {user.role}</p>
			<p>Active: {user.active}</p>
			<p>Email: {user.email}</p>
			<p>Verified: {user.emailVerified}</p>
		</li>
	{/each}
</ul>
