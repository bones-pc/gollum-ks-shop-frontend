<script lang="ts">
	import { _ } from "svelte-i18n";
	import type {
		Campaign,
		CampaignItem,
		KSCampaignListItem,
		OrderedItem,
	} from "../../api/Api";
	import InProgressButton from "../../utils/InProgressButton.svelte";
	import Modal from "../../utils/Modal.svelte";
	import { api, CampaignStatus, OrderedItemType } from "../../api/Api";
	import { Toast } from "bootstrap";
	import SimpleToast from "../../utils/SimpleToast.svelte";

	import { onMount } from "svelte";
	import OrdersHistory from "../../order/OrdersHistory.svelte";
	import SimplePickList from "../../utils/SimplePickList.svelte";

	export let title: string;
	export let add_item: () => void;
	export let add_shipping: () => void;
	export let add_admin_pledge: () => void;
	export let add_excel: (excel_helper: string) => void;
	export let delete_item: (item_uuid: string) => void;
	export let save: () => Promise<void>;
	export let items: CampaignItem[];
	export let campaign: Campaign;

	let pasteArea;
	let pastedImageSrc = "";
	const MAX_WIDTH = 500;
	const MAX_HEIGHT = 500;
	let campaign_status = campaign.status;
	let warehouseOn = false;

	onMount(() => {
		pasteArea.addEventListener("paste", handlePaste);
		pasteArea.addEventListener("keydown", preventTextInput);
		pasteArea.addEventListener("input", preventTextInput);
		const imageUrl = `../../images/${campaign.img_file}`;

		if (!campaign.img_file)
			pasteArea.style.backgroundImage = `url(${campaign.img_url})`;
		else pasteArea.style.backgroundImage = `url(${imageUrl})`;

		if (campaign_status === CampaignStatus.WAREHOUSE) warehouseOn = true;
	});

	const preventTextInput = (e) => {
		e.preventDefault();
	};

	const toggleWarehouse = () => {
		if (campaign.status === CampaignStatus.WAREHOUSE) {
			campaign.status = campaign_status;
			warehouseOn = false;
		} else {
			campaign.status = CampaignStatus.WAREHOUSE;
			warehouseOn = true;
		}
	};
	const handlePaste = async (event) => {
		const items = event.clipboardData.items;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.kind === "file" && item.type.startsWith("image/")) {
				const file = item.getAsFile();
				const formData = new FormData();
				formData.append("image", file);
				const reader = new FileReader();
				reader.onload = (e) => {
					pastedImageSrc = e.target.result;
					pasteArea.style.backgroundImage = `url(${e.target.result})`;
				};
				reader.readAsDataURL(file);
				try {
					const response = await api.uploadImage(formData);
					if (response.ok) {
						campaign.img_file = response.file.filename;
					} else {
						// console.log(response);
						console.error("Upload failed:", response.message);
					}
				} catch (error) {
					console.error("Error:", error);
				}
			}
		}
	};

	function validate_fields() {
		if (campaign.due_date === "") {
			warning_message = "Brak daty końca wpłat";
			return 1;
		}
		if (campaign.end_date === "") {
			warning_message = "Brak daty końca Kickstartera";
			return 1;
		}
		if (campaign.title == "") {
			warning_message = "Brak nazwy kampanii";
			return 1;
		}
		if (campaign.url == "") {
			warning_message = "Brak linku do kampanii";
		}
		warning_message = "";
	}
	let save_in_progress: boolean = false;

	async function save_with_progress() {
		// if (validate_fields()) {
		// 	showToast();
		// 	return;
		// }
		save_in_progress = true;
		// campaign.status = CampaignStatus.ACTIVE;
		await save();
		save_in_progress = false;
	}

	let showPopup = false;
	let excelHelper = false;
	let delete_uuid = "";
	let excel_helper = "";
	let warning_message = "";

	let toast_id = "edit_campaign_toast";
	function showToast() {
		let my_toast_el = document.getElementById(toast_id);
		let toast = new Toast(my_toast_el);
		toast.show();
	}

	const confirmDelete = () => {
		delete_uuid = campaign.uuid;
		showPopup = true;
	};
	const onClickOK = () => {
		showPopup = true;
		delete_campaign(delete_uuid);
	};
	const onPopupClose = () => {
		showPopup = false;
	};

	const onExitExcelHelper = () => {
		add_excel(excel_helper);
		excelHelper = false;
	};

	const onToggleExcelHelper = () => {
		excelHelper = !excelHelper;
	};

	async function delete_campaign(uuid: string) {
		let campaign_result = await api.changeStatus(uuid, CampaignStatus.DELETED);
		campaign_status = campaign_result.status;
	}
	async function ressurect_campaign() {
		let uuid = campaign.uuid;
		let campaign_result = await api.changeStatus(uuid, CampaignStatus.ACTIVE);
		campaign_status = campaign_result.status;
	}

	let game_search_name = "";
	let game_list_modal_visible = false;
	let game_list_modal = [];
	let selected_bgg_item = false;

	function closeBGGList() {
		game_list_modal_visible = false;
	}

	let search_index = null;

	async function selectedBGGItem(item_idx) {
		// console.log(item_idx);
		selected_bgg_item = true;
		// if (item_idx == 0) {
		// 	return;
		// }
		game_list_modal_visible = false;
		const game = await api.fetchBGGCampaign(item_idx);
		console.log(game);
		items[search_index].name = game.name;
		items[search_index].url = game.url;
		items[search_index].image = game.image;
	}

	let game_list = [];
	let search_game = "";
	async function search_campaign_in_bgg() {
		game_list = await api.fetchBGGCampaigns(search_game);
		// console.log(game_list);
		if (game_list.length > 0) {
			game_list_modal_visible = true;
			game_list_modal = game_list.map((e, idx) => {
				const return_item: KSCampaignListItem = {
					title: e.title,
					idx: e.id,
				};
				return return_item;
			});
		}
	}
</script>


<h1>
	{title}
</h1>
{#if warning_message != ""}
	<div class="alert alert-warning mt-4" role="alert">
		{warning_message}
	</div>
{/if}
<div class="mb-2">
	<button
		type="button"
		class="btn btn-primary"
		on:click={add_item}
		disabled={save_in_progress}
	>
		+ {$_("edit_campaign.add_item")}
	</button>

	<button type="button" class="btn btn-primary" on:click={onToggleExcelHelper}>
		+ {$_("edit_campaign.paste_items_button")}
	</button>

	<button
		type="button"
		class="btn btn-primary"
		on:click={add_shipping}
		disabled={save_in_progress}
	>
		+ {$_("edit_campaign.add_shipping")}
	</button>

	<button
		type="button"
		class="btn btn-primary"
		on:click={add_admin_pledge}
		disabled={save_in_progress}
		>+ {$_("edit_campaign.add_admin_pledge")}
	</button>
	<InProgressButton
		on_click_function={save_with_progress}
		label={$_("edit_campaign.save")}
		bind:in_progress={save_in_progress}
	/>
	{#if campaign_status == CampaignStatus.DELETED}
		<button
			type="button"
			class="btn btn-warning"
			on:click={ressurect_campaign}
			label={$_("edit_campaign.save")}>Odzyskaj</button
		>
	{:else}
		<button
			type="button"
			class="btn btn-warning"
			on:click={confirmDelete}
			label={$_("edit_campaign.save")}>Kasuj</button
		>
	{/if}

	<input
		type="checkbox"
		class="btn-check"
		id="btn-check-outlined"
		autocomplete="off"
		bind:checked={warehouseOn}
		on:click={toggleWarehouse}
	/>
	<label class="btn btn-outline-primary" for="btn-check-outlined"
		>Hurtownia</label
	><br />
</div>
<div class="mb-3">
	<label for="title" class="form-label">
		{$_("edit_campaign.campaign_title")}
	</label>
	<input
		class="form-control"
		type="text"
		id="title"
		bind:value={campaign.title}
		disabled={save_in_progress}
	/>
</div>
<div class="mb-3">
	<label class="form-label" for="campaign_url">
		{$_("edit_campaign.campaign_url")}
	</label>
	<div class="input-container">
		<input
			class="form-control"
			type="text"
			id="campaign_url"
			bind:value={campaign.url}
			disabled={save_in_progress}
		/><a target="_blank" href={campaign.url}>Go</a>
	</div>
</div>
<div class="mb-3">
	<label class="form-label" for="campaign_url">
		{$_("edit_campaign.image_url")}
	</label>
	<input
		class="form-control"
		type="text"
		id="campaign_img_url"
		bind:value={campaign.img_url}
		disabled={save_in_progress}
	/>
	<textarea id="paste-area" bind:this={pasteArea} placeholder="Wklej obrazek" />
</div>
<div class="mb-3">
	<label class="form-label" for="campaign_desc">
		{$_("edit_campaign.description")}
	</label>
	<textarea
		id="campaign_desc"
		class="form-control"
		bind:value={campaign.description}
		disabled={save_in_progress}
	/>
</div>

<div class="row container-fluid">
	<div class="mb-2 col-md-6">
		<label class="form-label" for="campaign_payment">
			{$_("edit_campaign.payment_details")}
		</label>
		<input
			class="form-control"
			type="text"
			id="campaign_payment"
			bind:value={campaign.payment_details}
			disabled={save_in_progress}
		/>
	</div>
	<div class="mb-2 col-md-6">
		<label class="form-label" for="campaign_payment">
			{$_("edit_campaign.due_date")}
		</label>
		<input
			class="form-control"
			type="date"
			id="campaign_payment"
			bind:value={campaign.due_date}
			disabled={save_in_progress}
		/>
	</div>
	<div class="mb-2 col-md-6">
		<label class="form-label" for="campaign_payment">
			{$_("edit_campaign.end_date")}
		</label>
		<input
			class="form-control"
			type="date"
			id="campaign_end_date"
			bind:value={campaign.end_date}
			disabled={save_in_progress}
		/>
	</div>
</div>

{#each [...items] as item, index}
	<div class="card mb-2" style="width: 100%;">
		<div class="card-body">
			<div class="input-group">
				{#if item.type == OrderedItemType.SHIPPING}
					<span class="input-group-text">&nbsp;&nbsp;</span>
				{:else if item.type == OrderedItemType.ADMIN_ADDON}
					<span class="input-group-text">&nbsp;&nbsp;</span>
				{:else}
					<span class="input-group-text">{item.ordinal}.</span>
				{/if}
				<span class="input-group-text" for="item_name_{item.uuid}">
					{$_("edit_campaign.item_name")}
				</span>
				<input
					class="form-control"
					type="text"
					id="item_name_{item.uuid}"
					bind:value={item.name}
					disabled={save_in_progress}
				/>
				{#if campaign.status === CampaignStatus.WAREHOUSE}
					<button
						type="button"
						class="btn btn-danger"
						on:click={() => {
							search_game = item.name;
							search_index = index;
							search_campaign_in_bgg();
						}}
						>Szukaj na BGG
					</button>
				{/if}
			</div>

			<div class="input-group">
				<span class="input-group-text" for="item_price_{item.uuid}">
					{$_("edit_campaign.item_price")}
				</span>
				<input
					on:focus={() => {
						if (item.price == 0) {
							// UGLY - Przemek's weird requirements ;)
							item.price = "";
						}
					}}
					on:focusout={() => {
						if (!item.price) {
							// UGLY - Przemek's weird requirements ;)
							item.price = 0;
						}
					}}
					class="form-control"
					type="number"
					min="0"
					id="item_price_{item.uuid}"
					bind:value={item.price}
					disabled={save_in_progress}
				/>
			</div>
			{#if campaign.status === CampaignStatus.WAREHOUSE && item.type !== OrderedItemType.SHIPPING && item.type !== OrderedItemType.ADMIN_ADDON}
				<div class="input-group">
					<span class="input-group-text" for="item_url_{item.uuid}"
						>Link do BGG:</span
					>
					<input
						class="form-control"
						id="item-url-{item.uuid}"
						bind:value={item.url}
						disabled={save_in_progress}
					/>
				</div>
				<div class="input-group">
					<span class="input-group-text" for="item_image_{item.uuid}">
						Obrazek
					</span>
					<input
						class="form-control"
						id="item-url-{item.uuid}"
						bind:value={item.image}
						disabled={save_in_progress}
					/>
				</div>
			{/if}
			{#if index < campaign.items.length}
				<button
					type="button"
					class="btn btn-danger"
					on:click={() => delete_item(item.uuid)}
					disabled={true}
				>
					{$_("edit_campaign.delete_item")}
				</button>
			{:else}
				<button
					type="button"
					class="btn btn-danger"
					on:click={() => delete_item(item.uuid)}
					disabled={false}
				>
					{$_("edit_campaign.delete_item")}
				</button>
			{/if}
		</div>
	</div>
{/each}

<SimpleToast {toast_id}>
	<div slot="toast-body">{warning_message}</div></SimpleToast
>
<SimplePickList
	open={game_list_modal_visible}
	onClose={closeBGGList}
	onSelected={selectedBGGItem}
	closeTitle={"Odrzuć"}
	list={game_list_modal}
/>

<Modal
	title={$_("edit_campaign.paste_items")}
	close={$_("edit_campaign.paste_items_skip")}
	action={$_("edit_campaign.paste_items_ok")}
	open={excelHelper}
	onClick={onExitExcelHelper}
	onClosed={onToggleExcelHelper}
>
	<div class="mb-3">
		<label class="form-label" for="campaign_desc">
			{$_("edit_campaign.paste_items_text")}
		</label>
		<textarea
			id="campaign_desc"
			class="form-control"
			bind:value={excel_helper}
		/>
	</div>
</Modal>

<Modal
	title={"Skasować?"}
	close={"Nie, no..."}
	action={"Serio!"}
	open={showPopup}
	onClick={() => onClickOK()}
	onClosed={() => onPopupClose()}
>
	Serio? Skasować <b>CAŁĄ</b>
	kampanię {campaign.title}?
</Modal>


<style>
	#paste-area {
		width: 100%;
		height: 150px;
		border: 2px dashed #ccc;
		padding: 20px;
		font-size: 16px;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		background-color: #f9f9f9;
	}

	.image-preview {
		margin-top: 20px;
		max-width: 100%;
		border: 1px solid #ccc;
		padding: 10px;
	}

	.card-body {
		align-items: flex-start;
		flex-direction: row;
		flex-wrap: wrap;
		display: flex;
		gap: 1rem;
	}
	.image-preview {
		margin-top: 20px;
		max-width: 100%;
		border: 1px solid #ccc;
		padding: 10px;
	}
	.input-group {
		width: 100%;
	}

	.input-container {
		display: flex;
		align-items: center;
	}

	.input-container input {
		margin-right: 10px;
		flex: 1;
	}

	.input-container a {
		text-decoration: none;
	}

	@media (min-width: 992px) {
		.input-group {
			width: auto;
			flex-grow: 1;
		}
	}
</style>
