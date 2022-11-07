<script lang="ts">
	import { Link, useNavigate } from "svelte-navigator";
	import { api, Campaign, CampaignStatus } from "../../api/Api";
	import { role } from "../../stores";
	import AccordionList from "../../utils/AccordionList.svelte";
	import SortPicker from "../../utils/SortPicker.svelte";
	import type { AccordionItem } from "../../utils/accordion_item";
	import { _ } from "svelte-i18n";
	import Legend from "../../utils/Legend.svelte";

	const navigate = useNavigate();
	const fetch_filter = { status: CampaignStatus.ACTIVE };

	let active_campaigns = [];

	function add_new_campaign() {
		navigate(`/campaigns/add`);
	}

	async function lock(uuid: string) {
		await api.changeStatus(uuid, CampaignStatus.CLOSED);
		active_campaigns = await fetch(null);
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
				description,
				payment_details,
				due_date,
				added_date,
			}) => ({
				id: uuid,
				title,
				url,
				img_url,
				description,
				payment_details,
				due_date,
				added_date,
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
		active_campaigns = await fetch(null);
		if (sort_option == 1) {
			active_campaigns.sort(sort_by_date);
			return;
		} else if (sort_option == 2) {
			active_campaigns.sort(sort_by_added_date);
			return;
		}
		active_campaigns.sort(sort_by_name);
	}
	function show_legend() {
		return true;
	}
</script>

<h1>{$_("active_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={active_campaigns}>
	<svelte:fragment slot="nav-actions">
		{#if $role.is_admin()}
			<button type="button" class="btn btn-primary" on:click={add_new_campaign}>
				+ {$_("active_campaigns.add_campaign")}
			</button>
		{/if}
		<SortPicker
			headline={sort_headline}
			onChangeHandler={sort}
			{sort_by_list}
			bind:selected={sort_option}
		/>
	</svelte:fragment>
	<svelte:fragment slot="item-actions" let:item>
		<ul>
			<li>
				<Link to="/order/{item.id}">{$_("active_campaigns.order")}</Link>
			</li>
			{#if $role.is_admin()}
				<li>
					<Link to="/campaigns/edit/{item.id}">
						{$_("active_campaigns.edit")}
					</Link>
				</li>
				<li>
					<Link to="/orders/{item.id}">
						{$_("active_campaigns.manage_orders")}
					</Link>
				</li>
				<li>
					<span class="fake-link" on:click={() => lock(item.id)}>
						{$_("active_campaigns.lock")}
					</span>
				</li>
			{/if}
		</ul>
	</svelte:fragment>
</AccordionList>
