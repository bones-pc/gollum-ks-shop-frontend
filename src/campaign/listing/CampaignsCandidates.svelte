<script lang="ts">
	import { Toast } from "bootstrap";
	import { faHeart } from "@fortawesome/free-solid-svg-icons";
	import { faHeart as faHeartOpen } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";
	import { useNavigate, Link } from "svelte-navigator";
	import {
		api,
		CampaignStatus,
		CampaignCandidate,
		OrderedItemType,
	} from "../../api/Api";
	import { role, user_uuid } from "../../stores";
	import AccordionList from "../../utils/AccordionList.svelte";
	import Legend from "../../utils/Legend.svelte";
	import type { AccordionItem } from "../../utils/accordion_item";
	import { _ } from "svelte-i18n";

	let candidates: (CampaignCandidate & AccordionItem)[] = [];
	const navigate = useNavigate();
	const sort_by_likes = (a: CampaignCandidate, b: CampaignCandidate) => {
		if (a.liking_users.length > b.liking_users.length) {
			return -1;
		}
		if (a.liking_users.length < b.liking_users.length) {
			return 1;
		}
		if (a.title > b.title) {
			return 1;
		}
		if (a.title < b.title) {
			return -1;
		}
		return 0;
	};

	async function fetch(
		search: string
	): Promise<(CampaignCandidate & AccordionItem)[]> {
		const fetched_candidates: CampaignCandidate[] =
			await api.fetchCampaignCandidates(search);
		fetched_candidates.forEach((c) => {
			if (c.liking_users.includes($user_uuid)) c.liked = true;
			else c.liked = false;
		});
		let confirmed_drafts = fetched_candidates
			.filter((c) => c.status === CampaignStatus.DRAFT_CONFIRMED)
			.sort(sort_by_likes)
			.map((c) => ({
				...c,
				id: c.uuid,
			}));

		let negotiated_drafts = fetched_candidates
			.filter((c) => c.status === CampaignStatus.DRAFT_NEGOTIATED)
			.sort(sort_by_likes)
			.map((c) => ({
				...c,
				id: c.uuid,
			}));
		let regular_drafts = fetched_candidates
			.filter((c) => c.status === CampaignStatus.DRAFT)
			.sort(sort_by_likes)
			.map((c) => ({
				...c,
				id: c.uuid,
			}));
		let denied_drafts = fetched_candidates
			.filter((c) => c.status === CampaignStatus.DRAFT_DENIED)
			.sort(sort_by_likes)
			.map((c) => ({
				...c,
				id: c.uuid,
			}));
		return [
			...confirmed_drafts,
			...negotiated_drafts,
			...regular_drafts,
			...denied_drafts,
		];
	}

	async function like(candidate_uuid: string) {
		await api.likeCandidate(candidate_uuid);
		candidates = await fetch(null);
	}

	async function unlike(candidate_uuid: string) {
		await api.unlikeCandidate(candidate_uuid);
		candidates = await fetch(null);
	}

	function add_draft() {
		navigate(`/new-draft`);
	}

	async function delete_campaign(uuid: string) {
		let campaign_result = await api.changeStatus(uuid, CampaignStatus.DELETED);
		candidates = await fetch(null);
	}

	async function toggle_confirm_campaign(item: CampaignCandidate) {
		let status = CampaignStatus.DRAFT_NEGOTIATED;

		if (item.status == CampaignStatus.DRAFT_CONFIRMED) {
			status = CampaignStatus.DRAFT;
		} else if (item.status == CampaignStatus.DRAFT) {
			status = CampaignStatus.DRAFT_NEGOTIATED;
		} else {
			status = CampaignStatus.DRAFT_CONFIRMED;
		}
		let campaign_result = await api.changeStatus(item.uuid, status);
		candidates = await fetch(null);
	}

	async function set_campaign_draft_not_happening(item: CampaignCandidate) {
		let status = CampaignStatus.DRAFT_DENIED;
		let campaign_result = await api.changeStatus(item.uuid, status);
		candidates = await fetch(null);
	}

	let legend_id = "campaign_legend";
	function showLegend() {
		let my_legend_el = document.getElementById(legend_id);
		let legend = new Toast(my_legend_el);
		legend.show();
	}
</script>

<h1>{$_("proposed_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={candidates}>
	<svelte:fragment slot="nav-actions">
		<button type="button" class="btn btn-primary" on:click={add_draft}>
			+ {$_("proposed_campaigns.add_draft")}
		</button>
		<button type="button" class="btn btn-primary" on:click={showLegend}
			>?</button
		>
	</svelte:fragment>
	<svelte:fragment slot="title" let:item>
		<div class="row">
			<div class="col">
				{#if item.url == null}
					{item.title}
				{:else}
					<a href={item.url} on:click={() => (document.location = item.url)}
						>{item.title}</a
					>
				{/if}
			</div>
			<div class="col-12 col-md">
				<!-- https://stackoverflow.com/questions/67281841/bootstrap-link-in-accordion-header-stoppropagation-not-working -->
				{#if item.status === CampaignStatus.PLACEHOLDER}
					<Fa icon={faHeart} primaryColor="red" />
					Polubiono...
				{:else if item.liked}
					<button
						class="btn btn-light non-collapsing"
						type="button"
						data-bs-toggle="collapse"
						data-bs-target
						on:click={() => unlike(item.id)}
					>
						<Fa icon={faHeart} primaryColor="red" />
						{$_(
							item.liking_users.length === 1
								? "proposed_campaigns.single_like"
								: "proposed_campaigns.likes",
							{ values: { count: item.liking_users.length } }
						)}
					</button>
				{:else}
					<button
						class="btn btn-light non-collapsing"
						type="button"
						data-bs-toggle="collapse"
						data-bs-target
						on:click={() => like(item.id)}
					>
						<Fa icon={faHeartOpen} />
						{$_(
							item.liking_users?.length === 1
								? "proposed_campaigns.single_like"
								: "proposed_campaigns.likes",
							{ values: { count: item.liking_users?.length } }
						)}
					</button>
				{/if}

				{#if item.status == CampaignStatus.DRAFT_CONFIRMED}
					<span class="badge bg-success"
						>{$_("proposed_campaigns.confirmed")}</span
					>
				{:else if item.status == CampaignStatus.DRAFT_DENIED}
					<span class="badge bg-danger">{$_("proposed_campaigns.denied")}</span>
				{:else if item.status == CampaignStatus.DRAFT_NEGOTIATED}
					<span class="badge bg-warning"
						>{$_("proposed_campaigns.negotiations")}</span
					>
				{/if}
			</div>
		</div>
	</svelte:fragment>
	<div slot="item-actions" let:item>
		<ul>
			{#if $role.is_admin()}
				<li>
					<Link to="/campaigns/add/{item.id}">
						{$_("proposed_campaigns.convert_to_active")}
					</Link>
				</li>
				<li>
					<Link to="/campaigns/candidate/edit/{item.id}">
						{$_("active_campaigns.edit")}
					</Link>
				</li>

				<li>
					<Link
						to="/drafts"
						on:click={() => {
							toggle_confirm_campaign(item);
						}}
					>
						{#if item.status == CampaignStatus.DRAFT}
							Ustaw w toku
							<!-- {$_("proposed_campaigns.confirm")} -->
						{:else if item.status == CampaignStatus.DRAFT_NEGOTIATED}
							Potwierdz
							<!-- {$_("proposed_campaigns.resign")} -->
						{:else if item.status == CampaignStatus.DRAFT_CONFIRMED}
							Ustaw jako zwykła
							<!-- {$_("proposed_campaigns.resign")} -->
						{/if}
					</Link>
				</li>
				<li>
					<Link
						to="/drafts"
						on:click={() => {
							set_campaign_draft_not_happening(item);
						}}
					>
						{#if item.status !== CampaignStatus.DRAFT_DENIED}
							{$_("proposed_campaigns.denied")}
						{/if}
					</Link>
				</li>

				<li>
					<Link
						to="/drafts"
						on:click={() => {
							delete_campaign(item.id);
						}}>{$_("proposed_campaigns.delete")}</Link
					>
				</li>
			{:else}
				<!-- {$_("proposed_campaigns.no_actions")} -->
			{/if}
		</ul>
	</div>
</AccordionList>

<Legend {legend_id} />

<style>
	.row {
		width: 100%;
	}

	.btn {
		padding-top: 0px;
		padding-bottom: 0px;
	}
</style>
