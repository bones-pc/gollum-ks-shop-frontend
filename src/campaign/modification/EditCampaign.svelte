<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { Campaign, CampaignItem } from "../../api/Api";
  import InProgressButton from "../../utils/InProgressButton.svelte";
  import Modal from "../../utils/Modal.svelte";
  import { api, CampaignStatus, OrderedItemType } from "../../api/Api";
  import { onMount } from "svelte";

  export let title: string;
  export let add_item: () => void;
  export let add_shipping: () => void;
  export let delete_item: (item_uuid: string) => void;
  export let save: () => Promise<void>;
  export let items: CampaignItem[];
  export let campaign: Campaign;

  let save_in_progress: boolean = false;
  async function save_with_progress() {
    save_in_progress = true;
    await save();
    save_in_progress = false;
  }

  let campaign_status = campaign.status;

  let showPopup = false;
  let delete_uuid = "";

  const confirmDelete = () => {
    delete_uuid = campaign.uuid;
    showPopup = true;
  };
  const onClick = () => {
    showPopup = true;
    delete_campaign(delete_uuid);
  };

  const onPopupClose = () => {
    showPopup = false;
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
</script>

<Modal
  title={"Skasować?"}
  close={"Nie, no..."}
  action={"Serio!"}
  open={showPopup}
  onClick={() => onClick()}
  onClosed={() => onPopupClose()}>
  Serio? Skasować <b>CAŁĄ</b>
  kampanię {campaign.title}?
</Modal>

<h1>
  {title}
</h1>

<div class="mb-2">
  <button
    type="button"
    class="btn btn-primary"
    on:click={add_item}
    disabled={save_in_progress}>
    + {$_("edit_campaign.add_item")}
  </button>

  <button
    type="button"
    class="btn btn-primary"
    on:click={add_shipping}
    disabled={save_in_progress}>
    + {$_("edit_campaign.add_shipping")}
  </button>

  <InProgressButton
    on_click_function={save_with_progress}
    label={$_("edit_campaign.save")}
    bind:in_progress={save_in_progress} />
  {#if campaign_status == CampaignStatus.DELETED}
    <button
      type="button"
      class="btn btn-warning"
      on:click={ressurect_campaign}
      label={$_("edit_campaign.save")}>
      Odzyskaj kampanię
    </button>
  {:else}
    <button
      type="button"
      class="btn btn-warning"
      on:click={confirmDelete}
      label={$_("edit_campaign.save")}>
      Kasuj kampanię
    </button>
  {/if}
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
    disabled={save_in_progress} />
</div>
<div class="mb-3">
  <label class="form-label" for="campaign_url">
    {$_("edit_campaign.campaign_url")}
  </label>
  <input
    class="form-control"
    type="text"
    id="campaign_url"
    bind:value={campaign.url}
    disabled={save_in_progress} />
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
    disabled={save_in_progress} />
</div>
<div class="mb-3">
  <label class="form-label" for="campaign_desc">
    {$_("edit_campaign.description")}
  </label>
  <textarea
    id="campaign_desc"
    class="form-control"
    bind:value={campaign.description}
    disabled={save_in_progress} />

  <!-- <input
		class="form-control"
		type="text"
		id="campaign_img_url"
		bind:value={campaign.description}
		disabled={save_in_progress}
	/> -->
</div>

<div class="mb-3">
  <label class="form-label" for="campaign_payment">
    {$_("edit_campaign.payment_details")}
  </label>
  <input
    class="form-control"
    type="text"
    id="campaign_payment"
    bind:value={campaign.payment_details}
    disabled={save_in_progress} />
</div>

{#each [...items] as item, index}
  <div class="card mb-2" style="width: 100%;">
    <div class="card-body">
      <div class="input-group">
        {#if item.type == OrderedItemType.SHIPPING}
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
          disabled={save_in_progress} />
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
          disabled={save_in_progress} />
      </div>
      {#if index < campaign.items.length}
        <button
          type="button"
          class="btn btn-danger"
          on:click={() => delete_item(item.uuid)}
          disabled={true}>
          {$_("edit_campaign.delete_item")}
        </button>
      {:else}
        <button
          type="button"
          class="btn btn-danger"
          on:click={() => delete_item(item.uuid)}
          disabled={false}>
          {$_("edit_campaign.delete_item")}
        </button>
      {/if}
    </div>
  </div>
{/each}

<style>
  .card-body {
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    display: flex;
    gap: 1rem;
  }

  .input-group {
    width: 100%;
  }

  @media (min-width: 992px) {
    .input-group {
      width: auto;
      flex-grow: 1;
    }
  }
</style>
