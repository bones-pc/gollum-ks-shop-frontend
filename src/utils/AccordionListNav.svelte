<script lang="ts">
	import type { ErrorResponse } from "../api/Data";
	import { debounce } from "../utils/debounce";
	import type { AccordionItem } from "./accordion_item";
	import { _ } from "svelte-i18n";

	export let items: AccordionItem[] | ErrorResponse;
	export let items_provider: (
		search: string | null
	) => Promise<AccordionItem[] | ErrorResponse>;
	let search: string = "";

	const filter = debounce(async () => {
		items = await items_provider(search);
	}, 500);
</script>

<div class="accordion-list-nav">
	<input
		type="text"
		bind:value={search}
		on:keyup={filter}
		placeholder={$_("campaigns.filter_by_name")}
	/>
	<slot name="actions" />
</div>

<style>
	.accordion-list-nav {
		display: flex;
		justify-content: flex-start;
		gap: 0.5em;
	}
</style>
