<script lang="ts">
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();
	let { user } = $derived(data);
</script>

<div>
	<p>
		{user ? user?.username : 'Nobody'} is signed in.
	</p>
</div>
