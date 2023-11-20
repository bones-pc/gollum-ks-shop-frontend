<script lang="ts">
	import { _ } from "svelte-i18n";
	import { navigate } from "svelte-navigator";
	import { v4 } from "uuid";
	import {
		api,
		CampaignCandidate,
		CampaignStatus,
		ErrorResponse,
	} from "../../api/Api";
	import InProgressButton from "../../utils/InProgressButton.svelte";
	import SimplePickList from "../../utils/SimplePickList.svelte";
	import { Toast } from "bootstrap";

	import SimpleToast from "../../utils/SimpleToast.svelte";

	let save_in_progress = false;

	const newDraft: () => CampaignCandidate = () => ({
		uuid: v4(),
		locked: false,
		title: "",
		img_url: "",
		url: "",
		liking_users: [],
		description: "",
		status: CampaignStatus.DRAFT,
		purchased: false,
		demotion: false,
		liked: false,
		added_date: new Date(),
	});
	let ks_name: string;
	let selected_item = false;
	let campaign_list_modal_visible = false;
	let warning = null;

	let draft: CampaignCandidate = newDraft();
	let campaign_list: CampaignCandidate[];
	let campaign_list_modal = [];

	async function save() {
		let draft_response: CampaignCandidate | ErrorResponse;
		draft_response = await api.addCandidate(draft);
		console.log(`resp: ${draft_response}`);
		if ((draft_response as ErrorResponse).status_code == 409) {
			warning = "Kampania już istnieje";
		} else {
			warning = null;
			navigate("/drafts");
		}
	}

	function closeList() {
		campaign_list_modal_visible = false;
	}

	function selectedItem(item_idx) {
		selected_item = true;
		if (item_idx == 0) {
			return;
		}
		item_idx--;
		campaign_list_modal_visible = false;
		draft.title = campaign_list[item_idx].title;
		draft.url = campaign_list[item_idx].url;
		draft.img_url = campaign_list[item_idx].img_url;
		draft.description = campaign_list[item_idx].description;
	}

	async function search_campaign_in_ks() {
		campaign_list = await api.fetchKSCampaigns(ks_name);
		if (campaign_list.length > 0) {
			campaign_list_modal_visible = true;
			campaign_list_modal = campaign_list.map((e, idx) => {
				let return_item = {};
				return_item.title = e.title;
				return_item.idx = idx;
				return return_item;
			});
		}
	}

	let toast_id = "ks_toast";
	let toast_body = "";
	function showToast(message: string) {
		toast_body = message;
		let my_toast_el = document.getElementById(toast_id);
		let toast = new Toast(my_toast_el);
		toast.show();
	}
</script>

{#if warning != null}
	<div class="alert alert-warning mt-4" role="alert">
		{warning}
	</div>
{/if}

<h1>
	{$_("add_draft.title_add", { values: { title: draft.title } })}
</h1>
<div class="mb-2">
	<div>
		<label for="title" class="form-label">Podaj nazwę gry z Gamefound </label>
		<input
			class="form-control"
			type="text"
			id="title"
			bind:value={ks_name}
			disabled={save_in_progress}
		/>
		<InProgressButton
			on_click_function={search_campaign_in_ks}
			label="szukaj na Gamefound"
			bind:in_progress={save_in_progress}
		/>

		<button
			type="button"
			class="btn btn-primary"
			on:click={() => {
				showToast(
					"Kickstarter skutecznie zablokował dostęp 'robotom', ale pracuję nad tym... na ten moment łatwo wyszukasz grę na Gamefound."
				);
			}}>?</button
		>
	</div>
	<div>
		<img alt={draft.description} src={draft.img_url} />
	</div>
</div>
<div class="mb-3">
	<label for="title" class="form-label">
		{$_("add_draft.campaign_title")}
	</label>
	<input
		class="form-control"
		type="text"
		id="title"
		bind:value={draft.title}
		disabled={save_in_progress}
	/>
</div>
<div class="mb-3">
	<label class="form-label" for="campaign_url">
		{$_("add_draft.campaign_url")}
	</label>
	<input
		class="form-control"
		type="text"
		id="campaign_url"
		bind:value={draft.url}
		disabled={save_in_progress}
	/>
</div>
<div class="mb-3">
	<label class="form-label" for="campaign_url">
		{$_("add_draft.image_url")}
	</label>
	<input
		class="form-control"
		type="text"
		id="campaign_img_url"
		bind:value={draft.img_url}
		disabled={save_in_progress}
	/>
</div>
<div class="mb-3">
	<label class="form-label" for="campaign_url">
		{$_("add_draft.description")}
	</label>
	<input
		class="form-control"
		type="text"
		id="campaign_description"
		bind:value={draft.description}
		disabled={save_in_progress}
	/>
</div>
<div class="mb-2">
	<InProgressButton
		on_click_function={save}
		label={$_("add_draft.save")}
		bind:in_progress={save_in_progress}
	/>
</div>

<SimplePickList
	open={campaign_list_modal_visible}
	onClose={closeList}
	onSelected={selectedItem}
	closeTitle={"Odrzuć"}
	list={campaign_list_modal}
/>

<SimpleToast {toast_id}>
	<div slot="toast-body">{toast_body}</div></SimpleToast
>
