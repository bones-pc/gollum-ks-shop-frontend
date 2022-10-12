<script lang="ts">
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import { useNavigate } from "svelte-navigator";
	import { v4 } from "uuid";
	import { api, Campaign, CampaignItem, CampaignStatus } from "../../api/Api";
	import EditCampaign from "./EditCampaign.svelte";
	import { get } from "svelte/store";

	import { OrderedItemType } from "../../api/Api";
	import OrdersHistory from "../../order/OrdersHistory.svelte";

	const whitespaces = /^\s*$/;
	let warning = null;
	const navigate = useNavigate();

	const newCampaign: () => Campaign = () => ({
		uuid: v4(),
		items: [],
		locked: false,
		title: "",
		img_url: "",
		url: "",
		status: CampaignStatus.ACTIVE,
		description: "",
		payment_details: "",
	});

	let campaign: Campaign;
	let items: CampaignItem[] = [];
	let shipping: CampaignItem = {
		// ordinal: 0,
		// name: "",
		// price: 0,
		// uuid: v4(),
		// type: OrderedItemType.PLEDGE,
	};

	onMount(async () => {
		campaign = newCampaign();
	});

	function delete_item(item_uuid: string) {
		items = items
			.filter(
				(it) => it.uuid !== item_uuid && it.type !== OrderedItemType.SHIPPING
			)
			.map((it, index) => ({ ...it, ordinal: index + 1 }));

		if (Object.keys(shipping).length) {
			if (shipping.uuid === item_uuid) {
				shipping = {};
			} else {
				items.unshift(shipping);
			}
		}
	}

	function add_shipping() {
		if (Object.keys(shipping).length === 0) {
			shipping.name = "InPost";
			shipping.price = 0;
			shipping.uuid = v4();
			shipping.ordinal = 0;
			shipping.type = OrderedItemType.SHIPPING;
			items.unshift(shipping);
		}
		items = items;
	}

	function add_item() {
		let ordinal = campaign.items.length + items.length + 1;
		if (Object.keys(shipping).length !== 0) ordinal--;
		items.push({
			name: "",
			price: 0,
			uuid: v4(),
			ordinal: ordinal,
			type: OrderedItemType.PLEDGE,
		});
		items = items;
	}

	const add_excel = (excel_helper: string) => {
		let item: CampaignItem = {
			ordinal: 0,
			name: "",
			price: 0,
			type: OrderedItemType.PLEDGE,
		};
		items = [];
		let data = excel_helper;

		let rows = data.split("\n");
		for (let y in rows) {
			let cells = rows[y].split("\t");
			items.push({
				name: cells[0],
				uuid: v4(),
				ordinal: parseInt(y),
				price: parseInt(cells[1]),
				type: OrderedItemType.PLEDGE,
			});
		}
	};

	function validate_form() {
		if (whitespaces.test(campaign.title)) {
			warning = get(_)("edit_campaign.title_must_not_be_empty");
			return false;
		}
		if (whitespaces.test(campaign.url)) {
			warning = get(_)("edit_campaign.url_must_not_be_empty");
			return false;
		}
		if (whitespaces.test(campaign.img_url)) {
			warning = get(_)("edit_campaign.image_must_not_be_empty");
			return false;
		}

		if (whitespaces.test(campaign.description)) {
			warning = get(_)("edit_campaign.description_must_not_be_empty");
			return false;
		}
		if (whitespaces.test(campaign.payment_details)) {
			warning = get(_)("edit_campaign.transfer_must_not_be_empty");
			return false;
		}
		return true;
	}

	async function save() {
		warning = null;
		if (!validate_form()) {
			return;
		}

		items.forEach((it) => (it.uuid = null));
		const campaign_with_extra_items: Campaign = {
			...campaign,
			items: [...items],
		};
		campaign = await api.updateCampaign({
			campaign: campaign_with_extra_items,
			is_new: true,
		});
		items = [];
		navigate(`/campaigns/edit/${campaign.uuid}`);
	}
</script>

{#if campaign == null}
	<h1>{$_("edit_campaign.loading")}</h1>
{:else}
	<EditCampaign
		{add_item}
		{add_shipping}
		{add_excel}
		{save}
		{delete_item}
		{campaign}
		{items}
		title={$_("edit_campaign.title_add", {
			values: { title: campaign.title },
		})}
	/>
	{#if warning != null}
		<div class="alert alert-warning mt-4" role="alert">
			{warning}
		</div>
	{/if}
{/if}
