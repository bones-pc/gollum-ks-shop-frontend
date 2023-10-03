<script lang="ts">
	import { Link } from "svelte-navigator";
	import { api, Campaign, CampaignStatus } from "../../api/Api";
	import { role } from "../../stores";
	import AccordionList from "../../utils/AccordionList.svelte";
	import type { AccordionItem } from "../../utils/accordion_item";
	import { _ } from "svelte-i18n";
	import SortPicker from "../../utils/SortPicker.svelte";

	const fetch_filter = { status: CampaignStatus.ARCHIVED };

	let inactive_campaigns = [];

	async function unlock(uuid: string) {
		await api.changeStatus(uuid, CampaignStatus.ACTIVE);
		inactive_campaigns = await fetch(null);
	}

	async function fetch(search: string): Promise<AccordionItem[]> {
		const campaigns: Campaign[] = await api.fetchCampaigns({
			titleLike: search,
			...fetch_filter,
		});
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
			}) => ({
				id: uuid,
				title,
				url,
				img_url,
				due_date,
				added_date,
				description,
				purchased,
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
		inactive_campaigns = await fetch(null);
		if (sort_option == 1) {
			inactive_campaigns.sort(sort_by_date);
			return;
		} else if (sort_option == 2) {
			inactive_campaigns.sort(sort_by_added_date);
			return;
		}
		inactive_campaigns.sort(sort_by_name);
	}
</script>

<h1>{$_("archived_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={inactive_campaigns}>
	<svelte:fragment slot="nav-actions">
		<SortPicker
			headline={sort_headline}
			onChangeHandler={sort}
			{sort_by_list}
			bind:selected={sort_option}
		/>
	</svelte:fragment>
	<div slot="item-actions" let:item>
		{#if $role.is_admin()}
			<ul>
				<li>
					<Link to="/campaigns/edit/{item.id}">
						{$_("archived_campaigns.edit_campaign")}
					</Link>
				</li>
				<li>
					<Link to="/orders/{item.id}">
						{$_("archived_campaigns.manage_orders")}
					</Link>
				</li>
				<li>
					<span class="fake-link" on:click={() => unlock(item.id)}>
						{$_("archived_campaigns.convert_to_active")}
					</span>
				</li>
			</ul>
		{:else}
			{$_("archived_campaigns.no_actions")}
		{/if}
	</div>
</AccordionList>
