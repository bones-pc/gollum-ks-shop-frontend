<script lang="ts">
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import { useNavigate } from "svelte-navigator";
	import { v4 } from "uuid";
	import { api, Campaign, CampaignItem, CampaignStatus } from "../../api/Api";
	import EditCampaign from "./EditCampaign.svelte";

	import { OrderedItemType } from "../../api/Api";
	import OrdersHistory from "../../order/OrdersHistory.svelte";

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
		console.log(shipping);
		if (Object.keys(shipping).length === 0) {
			shipping.name = "InPost";
			shipping.price = 0;
			shipping.uuid = v4();
			shipping.ordinal = 0;
			shipping.type = OrderedItemType.SHIPPING;
			items.unshift(shipping);
		}
		items = items;
		console.log(items);
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
		console.log(items);
	}

	async function save() {
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
		{save}
		{delete_item}
		{campaign}
		{items}
		title={$_("edit_campaign.title_add", {
			values: { title: campaign.title },
		})}
	/>
{/if}
