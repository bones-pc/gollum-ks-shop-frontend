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

  $: items = [...(campaign == null ? [] : campaign.items), ...removable_items];

  onMount(async () => {
    campaign = await api.fetchCampaign(uuid);
    shipping = campaign.items.find((it) => {
      return it.type == 1;
    });
    if (shipping == undefined) shipping = {};
  });

  function add_shipping() {
    if (Object.keys(shipping).length === 0) {
      shipping.name = "InPost";
      shipping.price = 0;
      shipping.uuid = "";
      shipping.ordinal = 0;
      shipping.type = OrderedItemType.SHIPPING;
      // campaign.items.unshift(shipping);
      removable_items.unshift(shipping);
    }
    campaign.items = campaign.items;
  }

  function delete_item(item_uuid: string) {
    // let shipping_item = items.filter(
    // 	(it) => it.uuid === item_uuid && it.type === OrderedItemType.SHIPPING
    // );
    // if (shipping_item.length) {
    // 	campaign.items = campaign.items
    // 		.filter(
    // 			(it) => it.uuid !== item_uuid && it.type !== OrderedItemType.SHIPPING
    // 		)
    // 		.map((it, index) => ({ ...it, ordinal: index + 1 }));
    // 	console.log("a", items);
    // 	shipping = {};
    // 	items = items;
    // } else {
    // 	removable_items = removable_items
    // 		.filter(
    // 			(it) => it.uuid !== item_uuid && it.type !== OrderedItemType.SHIPPING
    // 		)
    // 		.map((it, index) => ({ ...it, ordinal: index + 1 }));
    // 	// console.log("b", removable_items);
    // 	// if (Object.keys(shipping).length !== 0) campaign.items.unshift(shipping);
    // }

    let shipping_item = removable_items.find((it) => {
      it.type === OrderedItemType.SHIPPING;
    });
    console.log(shipping_item);
    if (Object.keys(shipping_item).length) {
      shipping = {};
    }
    removable_items = removable_items
      .filter((it) => it.uuid !== item_uuid)
      .map((it, index) => ({ ...it, ordinal: index + 1 }));
  }

  function add_item() {
    let ordinal = campaign.items.length + removable_items.length + 1;
    if (Object.keys(shipping).length !== 0) ordinal--;
    removable_items.push({
      name: "",
      price: 0,
      uuid: v4(),
      ordinal: ordinal,
      type: OrderedItemType.PLEDGE,
    });
    removable_items = removable_items;
  }

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
    {save}
    {delete_item}
    {campaign}
    {items}
    title={$_("edit_campaign.title_edit", {
      values: { title: campaign.title },
    })} />
{/if}
