<script lang="ts">
	interface Props {
		placement?: 'above' | 'below';
	}
	let { placement = 'above' }: Props = $props();
</script>

<div class="privacy placement-{placement}">
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path
			d="M7 1L2 3v4c0 2.8 2 5.2 5 6 3-.8 5-3.2 5-6V3L7 1z"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linejoin="round"
		/>
		<path
			d="M5 7l1.5 1.5L9 6"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
	<span>Your file never leaves this browser</span>
</div>
