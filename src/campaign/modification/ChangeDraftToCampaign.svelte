<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { useNavigate } from "svelte-navigator";
  import { v4 } from "uuid";
  import { api, Campaign, CampaignItem, CampaignStatus, OrderedItemType } from "../../api/Api";
  import Order from "../../order/Order.svelte";
  import EditCampaign from "./EditCampaign.svelte";

  export let candidate_uuid: string;

  const navigate = useNavigate();
  if (candidate_uuid == null) {
    navigate("/");
  }

  const newCampaign: () => Campaign = () => ({
    uuid: v4(),
    description: "",
    items: [],
    locked: false,
    title: "",
    img_url: "",
    url: "",
    status: CampaignStatus.ACTIVE,
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
    const candidate = await api.fetchCampaignCandidate(candidate_uuid);
    campaign = { ...newCampaign(), ...candidate, uuid: v4() };
  });

  function delete_item(item_uuid: string) {
    items = items
      .filter((it) => it.uuid !== item_uuid)
      .map((it, index) => ({ ...it, ordinal: index + 1 }));
  }

  async function save() {
    items.forEach((it) => (it.uuid = null));
    const campaign_with_extra_items: Campaign = {
      ...campaign,
      items: [...items],
    };
    campaign = await api.updateCampaign({
      campaign: campaign_with_extra_items,
      candidate_uuid,
      is_new: true,
    });
    items = [];
    navigate(`/campaigns/edit/${campaign.uuid}`);
  }

  function add_item() {
    items.push({
      name: "",
      price: 0,
      uuid: v4(),
      ordinal: campaign.items.length + items.length + 1,
      type: OrderedItemType.PLEDGE
    });
    items = items;
  }


	function add_shipping() {
    console.log(`add shipping`)

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
				ordinal: parseInt(y)+1,
				price: parseInt(cells[1]),
				type: OrderedItemType.PLEDGE,
			});
		}
    shipping ={}
	};



</script>

{#if campaign == null}
  <h1>{$_("edit_campaign.loading")}</h1>
{:else}
  <EditCampaign
    {add_item}
    {save}
    {add_shipping}
    {add_excel}
    {delete_item}
    {campaign}
    {items}
    title={$_("edit_campaign.title_add", {
      values: { title: campaign.title },
    })} />
{/if}
