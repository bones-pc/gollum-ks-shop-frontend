<script lang="ts">
	import { Link, navigate } from "svelte-navigator";
	import {
		api,
		Campaign,
		CampaignStatus,
		ErrorResponse,
		ResponseStatusCode,
	} from "../../api/Api";
	import { role } from "../../stores";
	import AccordionList from "../../utils/AccordionList.svelte";
	import type { AccordionItem } from "../../utils/accordion_item";
	import { _ } from "svelte-i18n";
	import { permissions } from "../../authentication/roles";
	import { Toast } from "bootstrap";
	import SimpleToast from "../../utils/SimpleToast.svelte";
	import CampaignsCandidates from "./CampaignsCandidates.svelte";

	let toast_message = "";
	let toast_id = Math.floor(Math.random() * 1000) + "active_draft_toast";
	function showToast(text: string, path: string) {
		toast_message = text;
		let my_toast_el = document.getElementById(toast_id);
		let toast = new Toast(my_toast_el);
		setTimeout(() => {
			navigate(path);
			toast.hide();
		}, 2000);
	}

	const fetch_filter = { status: CampaignStatus.ARCHIVED };

	let inactive_campaigns: Campaign[] | ErrorResponse = [];
	async function unlock(uuid: string) {
		await api.changeStatus(uuid, CampaignStatus.ACTIVE);
		inactive_campaigns = await fetch(null);
	}

	async function fetch(
		search: string
	): Promise<AccordionItem[] | ErrorResponse> {
		const campaigns: Campaign[] | ErrorResponse = await api.fetchCampaigns({
			titleLike: search,
			...fetch_filter,
		});
		if (
			(campaigns as ErrorResponse).status_code ===
			ResponseStatusCode.NOT_ALLOWED
		) {
			const response: ErrorResponse = {
				status_code: ResponseStatusCode.NOT_ALLOWED,
				message: "Brak uprawnień",
			};
			showToast("Brak uprawnień", "/");
			return;
		}
		return (campaigns as AccordionItem[]).map(
			(campaign: Campaign): AccordionItem => {
				const acc: AccordionItem = {
					id: campaign.uuid,
					title: campaign.title,
					url: campaign.url,
					img_url: campaign.img_url,
					purchased: campaign.purchased,
					due_date: campaign.due_date,
					added_date: campaign.added_date,
					description: campaign.description,
				};
				return acc;
			}
		);
	}
</script>

<h1>{$_("archived_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={inactive_campaigns}>
	<div slot="item-actions" let:item>
		<ul>
			{#if $role.check_role(permissions.campaign.UPDATE)}
				<li>
					<Link to="/campaigns/edit/{item.id}">
						{$_("archived_campaigns.edit_campaign")}
					</Link>
				</li>
			{/if}
			{#if $role.check_role(permissions.campaign.UPDATE)}
				<li>
					<Link to="/orders/{item.id}">
						{$_("archived_campaigns.manage_orders")}
					</Link>
				</li>
			{/if}
			{#if $role.check_role(permissions.campaign.UPDATE)}
				<li>
					<span class="fake-link" on:click={() => unlock(item.id)}>
						{$_("archived_campaigns.convert_to_active")}
					</span>
				</li>
			{/if}
		</ul>
	</div>
	<!-- {$_("archived_campaigns.no_actions")} -->
</AccordionList>

<SimpleToast {toast_id}
	><div slot="toast-body">{toast_message}</div></SimpleToast
>
