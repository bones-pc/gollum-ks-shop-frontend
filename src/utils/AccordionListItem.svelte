<script lang="ts">
	import type { AccordionItem } from "./accordion_item";
	import { role } from "../stores";
	import { CampaignStatus } from "../api/Data";
	import CampaignsCandidates from "../campaign/listing/CampaignsCandidates.svelte";
	import { Link } from "svelte-navigator";
	export let item: AccordionItem;
</script>

<div class="accordion-item">
	<h2 class="accordion-header" id="headingOne">
		<div style="display: flex;">
			<div class="d-none d-md-inline">
				{#if item.url === null}
					<img
						class="accordion-list-item"
						src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
						alt="item miniature"
					/>
				{:else if $role.is_admin()}
					<Link to="/orders/{item.id}">
						<img
							class="accordion-list-item"
							src={item.img_url}
							alt="item miniature"
						/>
					</Link>
				{:else}
					<a href={item.url}>
						<img
							class="accordion-list-item"
							src={item.img_url}
							alt="item miniature"
						/>
					</a>
				{/if}
			</div>
			<!-- {#if $role.is_admin()} <div class="notyetpaid">!</div>{/if} -->

			{#if item.status === CampaignStatus.PLACEHOLDER}
				<button
					class="accordion-button collapsed"
					type="button"
					data-bs-target={"#collapse" + item.id}
					aria-expanded="true"
					aria-controls={"collapse" + item.id}
				>
					<slot name="title" />
				</button>
			{:else}
				<button
					class="accordion-button collapsed"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target={"#collapse" + item.id}
					aria-expanded="true"
					aria-controls={"collapse" + item.id}
				>
					<slot name="title" />
				</button>
			{/if}
		</div>
	</h2>
	{#if item.status === CampaignStatus.PLACEHOLDER}
		<div
			id={"collapse" + item.id}
			class="accordion-collapse collapse"
			aria-labelledby="headingOne"
			data-bs-parent="#accordionExample"
		>
			<div class="accordion-body" />
		</div>
	{:else}
		<div
			id={"collapse" + item.id}
			class="accordion-collapse collapse"
			aria-labelledby="headingOne"
			data-bs-parent="#accordionExample"
		>
			<div class="accordion-body">
				<slot name="actions" />
			</div>
		</div>
	{/if}
</div>

<style>
	img {
		width: 90px;
		height: 59px;
		object-fit: cover;
		overflow: hidden;
		float: left;
		font-size: 1rem;
		line-height: 26px;
		text-align: center;
	}

	.accordion-button {
		width: none !important;
		flex: 1;
	}

	.accordion-button:focus {
		box-shadow: none !important;
	}
	.notyetpaid {
		margin: 10px;
	}
</style>
