<script lang="ts">
	import { onMount } from "svelte";
	import { flip } from "svelte/animate";
	import { fade } from "svelte/transition";
	import AccordeonHeader from "./AccordeonHeader.svelte";

	import AccordionListItem from "./AccordionListItem.svelte";
	import AccordionListNav from "./AccordionListNav.svelte";
	import type { AccordionItem } from "./accordion_item";
	import type { ErrorResponse } from "../api/Data";
	import { CampaignStatus } from "../api/Data";

	export let items_provider: (
		search: string | null
	) => Promise<AccordionItem[] | ErrorResponse>;
	export let items: any[] | ErrorResponse = [];

	onMount(async () => {
		items = await items_provider(null);
		(items as any[]).unshift({
			title: "Nazwa",
			url: null,
			img_url: "",
			id: "header",
			purchased: false,
			due_date: "Data Zakończenia",
			status: CampaignStatus.PLACEHOLDER,
		});
	});
</script>

<AccordionListNav bind:items {items_provider}>
	<slot slot="actions" name="nav-actions" />
</AccordionListNav>

<AccordeonHeader>
	<div class="row mt-3 small" slot="title">
		<div class="img" />
		<div class="col-md-5">Nazwa</div>
		<div class=" col-md-3">Data końca</div>
		<div class=" col-md-2">Data dodania</div>
	</div>
</AccordeonHeader>
<div class="row campaigns-row">
	<div class="mb-2 mt-2">
		<div class="accordion" id="accordionExample">
			{#each items as item (item.id)}
				<div
					animate:flip={{ duration: (d) => 100 * Math.sqrt(d) }}
					transition:fade|local
				>
					<AccordionListItem {item}>
						<slot name="item-actions" slot="actions" {item} />
						<slot name="title" slot="title" {item}>
							<div class="col-sm-6">
								{#if item.url == null}
									{item.title}
								{:else}
									<a href={item.url} target="_blank">{item.title}</a>
								{/if}
							</div>
							<div class="col-sm-3">
								{item.due_date}
							</div>
							<!-- <div class="col-sm-3">
								{item.added_date}
							</div> -->
						</slot>
					</AccordionListItem>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.img {
		width: 90px;
		object-fit: cover;
		overflow: hidden;
		float: left;
		font-size: 1rem;
		line-height: 26px;
		text-align: center;
	}
</style>
