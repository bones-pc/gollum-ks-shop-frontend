<script lang="ts">
	import { onMount } from "svelte";
	import { Link } from "svelte-navigator";
	import { _ } from "svelte-i18n";
	import CopyToClipboardField from "../utils/CopyToClipboardField.svelte";
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";

	import {
		AssignedToUser,
		Campaign,
		CampaignItem,
		Order,
		api,
		OrderedItemType,
		OrderedItem,
		OrderedItemAdmin,
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

	let admin_addons: CampaignItem[];

	async function change_order(
		campaign_uuid: string,
		owner_uuid: string,
		items: OrderedItemAdmin[]
	) {
		const savedOrder = await api.patchOrder(campaign_uuid, owner_uuid, items);
		// showToast();
	}

	const sort_by_order_date = (a: Order, b: Order) => {
		if (a.order_date < b.order_date) {
			return -1;
		}
		if (a.order_date > b.order_date) {
			return 1;
		}
		return 0;
	};

	onMount(async () => {
		const [o, c] = await Promise.all([
			api.fetchCampaignOrders(uuid),
			api.fetchCampaign(uuid),
		]);
		orders = o.sort(sort_by_order_date);
		admin_addons = c.items.filter((v) => v.type == OrderedItemType.ADMIN_ADDON);
		campaign = c;
		// console.log(o);
		// console.log(c);
	});

	async function confirm(order: Order & AssignedToUser) {
		await api.updatePaidAmount(order);
	}

	async function mark_as_sent(order: Order) {
		let order_return = await api.updateOrderTracking(order);
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
	<div>
		{$_("manage_orders.orders_summary.paid", {
			values: { totalGathered, totalPrice },
		})}
		<ul>
			{#each totalItems as totalItem}
				<li>
					{totalItem.ordinal}. {totalItem.name}: {totalItem.total_amount}
				</li>
			{/each}
		</ul>
	</div>

	<div>
		Tytuł przelewu:
		<CopyToClipboardField copy_value={campaign.payment_details} />
	</div>
	<div>
		Dodatkowe koszty:
		<ul>
			{#each admin_addons as addon}
				<li>
					{addon.name}: {addon.price}
					<button class="btn btn-outline-secondary change-amount">+</button>
				</li>
			{/each}
		</ul>
	</div>

	<h4>{$_("manage_orders.per_user_summary")}</h4>
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
				label="Confirm"
			/>

			{$_("manage_orders.tracking")}
			<input id="tracking" bind:value={order.tracking_no} />
			{#if !order.tracking_no}
				<InProgressButton
					btn_class={"btn-danger"}
					on_click_function={async () => mark_as_sent(order)}
					label="Nie wysłane"
				/>
			{:else}
				<InProgressButton
					btn_class={"btn-success"}
					on_click_function={async () => mark_as_sent(order)}
					label="Wysłane"
				/>
			{/if}
		</div>
		<ul>
			{#each order.items as item}
				<li>
					<div class="row">
						<div class="col-md-3 mid">
							{itemByUuid.get(item.item_uuid).ordinal}. {itemByUuid.get(
								item.item_uuid
							).name}: {item.amount}
						</div>
						<div class="col-md-1 mid">
							<button
								type="button"
								class="btn btn-outline-secondary change-amount"
								on:click={async () => {
									item.amount++;
									await change_order(campaign.uuid, order.ouuid, order.items);
								}}>+</button
							>
						</div>
						<div class="col-md-8">
							<button
								type="button"
								class="btn btn-outline-secondary change-amount"
								on:click={async () => {
									item.amount = Math.max(0, item.amount - 1);
									await change_order(campaign.uuid, order.ouuid, order.items);
								}}>-</button
							>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/each}
{/if}

<style>
	.money {
		max-width: 120px;
	}
	.mid {
		vertical-align: middle;
	}
	ul {
		list-style-type: none;
	}
	.circle-btn {
		background-color: #ffffff;
		border: 1;
		color: rgb(0, 0, 0);
		padding: 10px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
		margin: 2px 2px;
		border-radius: 50%;
	}
</style>
