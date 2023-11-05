<script lang="ts">
	import { Link, useNavigate } from "svelte-navigator";
	import { api, Campaign, CampaignStatus } from "../../api/Api";
	import { role } from "../../stores";
	import AccordionList from "../../utils/AccordionList.svelte";
	import type { AccordionItem } from "../../utils/accordion_item";
	import { _ } from "svelte-i18n";
	import SortPicker from "../../utils/SortPicker.svelte";

	const navigate = useNavigate();
	const fetch_filter = { status: CampaignStatus.CLOSED };

	let closed_campaigns = [];

	async function lock(uuid: string) {
		await api.changeStatus(uuid, CampaignStatus.ARCHIVED);
		closed_campaigns = await fetch(null);
	}

	async function unlock(uuid: string) {
		await api.changeStatus(uuid, CampaignStatus.ACTIVE);
		closed_campaigns = await fetch(null);
	}

	async function fetch(search: string): Promise<AccordionItem[]> {
		const campaigns: Campaign[] = await api.fetchCampaigns({
			titleLike: search,
			...fetch_filter,
		});
		console.log(campaigns);
		return campaigns.map(
			({
				uuid,
				title,
				url,
				img_url,
				due_date,
				added_date,
				description,
				purchased,
				items,
				status,
			}) => ({
				id: uuid,
				title,
				url,
				img_url,
				due_date,
				added_date,
				description,
				purchased,
				items,
				status,
			})
		);
	}

	let sort_by_list = ["nazwie", "dacie zakończenia", "dacie dodania"];
	let sort_headline = "Sortuj po ";
	let sort_option = 0;

	function sort_by_name(a: AccordionItem, b: AccordionItem) {
		if (a.title > b.title) {
			return 1;
		}
		if (a.title < b.title) {
			return -1;
		}
		return 0;
	}
	function sort_by_date(a, b) {
		if (a.due_date > b.due_date) {
			return 1;
		}
		if (a.due_date < b.due_date) {
			return -1;
		}
		return 0;
	}
	function sort_by_added_date(a, b) {
		if (a.added_date > b.added_date) {
			return 1;
		}
		if (a.added_date < b.added_date) {
			return -1;
		}
		return 0;
	}
	async function sort() {
		closed_campaigns = await fetch(null);
		if (sort_option == 1) {
			closed_campaigns.sort(sort_by_date);
			return;
		} else if (sort_option == 2) {
			closed_campaigns.sort(sort_by_added_date);
			return;
		}
		closed_campaigns.sort(sort_by_name);
	}
</script>

<h1>{$_("closed_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={closed_campaigns}>
	<svelte:fragment slot="nav-actions">
		<SortPicker
			headline={sort_headline}
			onChangeHandler={sort}
			{sort_by_list}
			bind:selected={sort_option}
		/>
	</svelte:fragment>
	<svelte:fragment slot="item-actions" let:item>
		<ul>
			{#if $role.is_admin()}
				<ul>
					<li>
						<Link to="/campaigns/edit/{item.id}">
							{$_("closed_campaigns.edit_campaign")}
						</Link>
					</li>
					<li>
						<Link to="/orders/{item.id}">
							{$_("closed_campaigns.manage_orders")}
						</Link>
					</li>
					<li>
						<span class="fake-link" on:click={() => unlock(item.id)}>
							{$_("closed_campaigns.convert_to_active")}
						</span>
					</li>
					<li>
						<span class="fake-link" on:click={() => lock(item.id)}>
							{$_("closed_campaigns.convert_to_archived")}
						</span>
					</li>
				</ul>
			{:else}
				<ul>
					{#each item.items as pledge (pledge.uuid)}
						{#if pledge.type == 0}
							<li>
								{pledge.name}: {pledge.price}
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
		</ul>
	</svelte:fragment>
</AccordionList>
