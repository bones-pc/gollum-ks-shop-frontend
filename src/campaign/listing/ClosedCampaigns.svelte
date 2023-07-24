<script lang="ts">
	import { Link, useNavigate } from "svelte-navigator";
	import { api, Campaign, CampaignStatus } from "../../api/Api";
	import { role } from "../../stores";
	import AccordionList from "../../utils/AccordionList.svelte";
	import type { AccordionItem } from "../../utils/accordion_item";
	import { _ } from "svelte-i18n";
	import { permissions } from "../../authentication/roles";

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
		const campaigns = await api.fetchCampaigns({
			titleLike: search,
			...fetch_filter,
		});
		return (campaigns as Campaign[]).map(
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
	let menu_count = 0;
</script>

<h1>{$_("closed_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={closed_campaigns}>
	<svelte:fragment slot="item-actions" let:item>
		<ul>
			<ul>
				{#if $role.check_role(permissions.campaign.UPDATE)}
					<li>
						<Link to="/campaigns/edit/{item.id}">
							{$_("closed_campaigns.edit_campaign")}
						</Link>
					</li>
				{/if}
				{#if $role.check_role(permissions.orders.UPDATE)}
					<li>
						<Link to="/orders/{item.id}">
							{$_("closed_campaigns.manage_orders")}
						</Link>
					</li>
				{/if}
				{#if $role.check_role(permissions.campaign.UPDATE)}
					<li>
						<span class="fake-link" on:click={() => unlock(item.id)}>
							{$_("closed_campaigns.convert_to_active")}
						</span>
					</li>
				{/if}
				{#if $role.check_role(permissions.campaign.UPDATE)}
					<li>
						<span class="fake-link" on:click={() => lock(item.id)}>
							{$_("closed_campaigns.convert_to_archived")}
						</span>
					</li>
				{/if}
			</ul>
		</ul>
	</svelte:fragment>
</AccordionList>
