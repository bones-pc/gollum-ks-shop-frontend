<script lang="ts">
  import { onMount } from "svelte";
  import { Link } from "svelte-navigator";
  import { _ } from "svelte-i18n";

  import {
    AssignedToUser,
    Campaign,
    CampaignItem,
    Order,
    api,
  } from "../api/Api";
  import InProgressButton from "../utils/InProgressButton.svelte";

  export let uuid: string;

  let orders: (Order & AssignedToUser)[] = null;
  let campaign: Campaign;
  let totalItems = [];
  let totalGathered = 0;
  let totalPrice = 0;
  let tracking_no = "";

  $: itemByUuid = new Map<string, CampaignItem>(
    campaign?.items?.map((item) => [item.uuid, item]) ?? []
  );

  $: {
    if (campaign != null && orders != null) {
      let itemOccurrences = new Map<string, number>();
      orders.forEach((order) =>
        order.items.forEach((item) => {
          const previous = itemOccurrences.get(item.item_uuid) ?? 0;
          itemOccurrences.set(item.item_uuid, previous + item.amount);
        })
      );
      totalItems = campaign.items
        .map((item) => ({
          ...item,
          total_amount: itemOccurrences.get(item.uuid) ?? 0,
        }))
        .filter((item) => item.total_amount > 0);
      totalPrice = totalItems.reduce(
        (acc, item) => acc + item.total_amount * item.price,
        0
      );
      totalGathered = orders.reduce((acc, order) => acc + order.paid_amount, 0);
    }
  }

  onMount(async () => {
    const [o, c] = await Promise.all([
      api.fetchCampaignOrders(uuid),
      api.fetchCampaign(uuid),
    ]);
    orders = o;
    campaign = c;
  });

  async function confirm(order: Order & AssignedToUser) {
    await api.updatePaidAmount(order);
  }

  async function mark_as_sent(order: Order) {
    let order_return = await api.updateOrderTracking(order);
    console.log("mark ", order_return);
    tracking_no = order_return.tracking_no;
  }
</script>

{#if orders === null}
  <h1>{$_("manage_orders.loading")}</h1>
{/if}

{#if campaign != null && orders != null}
  <h1>
    {$_("manage_orders.title", { values: { campaign_title: campaign.title } })}
  </h1>

  <h2>{$_("manage_orders.orders_summary")}</h2>
  <p>
    {$_("manage_orders.orders_summary.paid", {
      values: { totalGathered, totalPrice },
    })}
  </p>
  <ul>
    {#each totalItems as totalItem}
      <li>{totalItem.ordinal}. {totalItem.name}: {totalItem.total_amount}</li>
    {/each}
  </ul>

  <h3>{$_("manage_orders.per_user_summary")}</h3>
  {#each orders as order}
    {order.firstname}
    {order.lastname}
    (<Link to="/user-detail/{order.ouuid}">{order.username}</Link>)
    <div>
      <span>{$_("manage_orders.per_user_summary.paid")}</span>
      <input type="number" bind:value={order.paid_amount} class="money" />
      <span class="me-1">
        {$_("manage_orders.per_user_summary.out_of")}
        {order.items.reduce(
          (acc, item) =>
            acc + itemByUuid.get(item.item_uuid).price * item.amount,
          0
        )}
      </span>
      <InProgressButton
        on_click_function={async () => confirm(order)}
        label="Confirm" />

      {$_("manage_orders.tracking")}
      <input id="tracking" bind:value={order.tracking_no} />
      {#if !order.tracking_no}
        <InProgressButton
          btn_class={"btn-danger"}
          on_click_function={async () => mark_as_sent(order)}
          label="Nie wysłane" />
      {:else}
        <InProgressButton
          btn_class={"btn-success"}
          on_click_function={async () => mark_as_sent(order)}
          label="Wysłane" />
      {/if}
    </div>
    <ul>
      {#each order.items as item}
        <li>{itemByUuid.get(item.item_uuid).name}: {item.amount}</li>
      {/each}
    </ul>
  {/each}
{/if}

<style>
  .money {
    max-width: 120px;
  }
</style>
