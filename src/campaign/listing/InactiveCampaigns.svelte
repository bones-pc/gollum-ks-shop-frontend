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

	async function fetch(search: string): Promise<AccordionItem[]> {
		const campaigns: Campaign[] = await api.fetchCampaigns({
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
