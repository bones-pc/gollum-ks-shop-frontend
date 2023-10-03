<script lang="ts">
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import { useNavigate } from "svelte-navigator";
	import { v4 } from "uuid";
	import { api, Campaign, CampaignItem } from "../../api/Api";
	import EditCampaign from "./EditCampaign.svelte";
	import { OrderedItemType } from "../../api/Api";

	export let uuid: string;

	const navigate = useNavigate();

	if (uuid == null) {
		navigate("/");
	}

	let campaign: Campaign;
	let removable_items: CampaignItem[] = [];
	let shipping: CampaignItem = {
		// ordinal: 0,
		// name: "",
		// price: 0,
		// uuid: v4(),
		// type: OrderedItemType.SHIPPING,
	};
	let shipping_items_count: number = 0;

	$: items = [...(campaign == null ? [] : campaign.items), ...removable_items];

	onMount(async () => {
		campaign = await api.fetchCampaign(uuid);
		shipping = campaign.items.find((it) => {
			return it.type == 1;
		});
		if (shipping == undefined) shipping = {};
		shipping_items_count = campaign.items.filter((v) => v.ordinal == 0).length;
	});

	function add_admin_pledge() {
		removable_items.unshift({
			name: "",
			price: 0,
			uuid: v4(),
			ordinal: 0,
			type: OrderedItemType.ADMIN_ADDON,
		});
		removable_items = removable_items;
	}

	function add_shipping() {
		console.log("shipping");
		if (Object.keys(shipping).length === 0) {
			console.log("missing");
			shipping.name = "InPost";
			shipping.price = 0;
			shipping.uuid = "";
			shipping.ordinal = 0;
			shipping.type = OrderedItemType.SHIPPING;
			removable_items.unshift(shipping);
		}
		// campaign.items = campaign.items;
		removable_items = removable_items;
	}

	function delete_item(item_uuid: string) {
		console.log(`delete ${item_uuid}`);
		let shipping_item = removable_items.find((it) => {
			it.type === OrderedItemType.SHIPPING;
		});
		console.log(`shipping item ${shipping_item}`);

		if (shipping_item) {
			if (Object.keys(shipping_item).length) {
				shipping = {};
			}
		}
		removable_items = removable_items
			.filter((it) => it.uuid !== item_uuid)
			.map((it, index) => ({ ...it, ordinal: index + 1 }));
	}

	function add_item() {
		let ordinal = campaign.items.length + removable_items.length + 1;
		if (Object.keys(shipping).length !== 0) ordinal--;
		let items = [...campaign.items, ...removable_items];
		let admin_pledge = items.filter(
			(i) => i.type === OrderedItemType.ADMIN_ADDON
		);

		if (admin_pledge.length) ordinal -= admin_pledge.length;
		removable_items.push({
			name: "",
			price: 0,
			uuid: v4(),
			ordinal: ordinal,
			type: OrderedItemType.PLEDGE,
		});
		removable_items = removable_items;
	}

	const add_excel = (excel_helper: string) => {
		let item: CampaignItem = {
			ordinal: 0,
			name: "",
			price: 0,
			type: OrderedItemType.PLEDGE,
		};
		removable_items = [];
		let data = excel_helper;

		let rows = data.split("\n");
		for (let y in rows) {
			let cells = rows[y].split("\t");
			removable_items.push({
				name: cells[0],
				uuid: v4(),
				ordinal: parseInt(y) + campaign.items.length - shipping_items_count + 1,
				price: parseInt(cells[1]),
				type: OrderedItemType.PLEDGE,
			});
		}
		shipping = {};
	};

	async function save() {
		removable_items.forEach((it) => (it.uuid = null));
		const campaign_with_extra_items: Campaign = {
			...campaign,
			items: [...campaign.items, ...removable_items],
		};
		console.log(campaign_with_extra_items);
		campaign = await api.updateCampaign({
			campaign: campaign_with_extra_items,
			is_new: false,
		});
		removable_items = [];
	}
</script>

{#if campaign == null}
	<h1>{$_("edit_campaign.loading")}</h1>
{:else}
	<EditCampaign
		{add_item}
		{add_shipping}
		{add_admin_pledge}
		{add_excel}
		{save}
		{delete_item}
		{campaign}
		{items}
		title={$_("edit_campaign.title_edit", {
			values: { title: campaign.title },
		})}
	/>
{/if}
