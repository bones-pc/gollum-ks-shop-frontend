<script lang="ts">
	import { faSortAmountAsc } from "@fortawesome/free-solid-svg-icons";
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";

	import { api, Order, Campaign, OrderedItem } from "../api/Api";
	import InProgressButton from "../utils/InProgressButton.svelte";

	export let uuid: string;

	let campaign: Campaign = null;
	let items = [];
	let new_order = null;
	let paid_amount = 0;
	$: totalPrice = items
		.map((i) => i.item.price * i.amount)
		.reduce((acc, x) => acc + x, 0);

	function fill_form(campaign: Campaign, order: Order) {
		const orderItems = new Map<string, OrderedItem>();
		if (order != null) {
			order.items.forEach((i) => orderItems.set(i.item_uuid, i));
		}
		items = campaign.items.map((i) => ({
			amount: orderItems.get(i.uuid)?.amount ?? 0,
			item: { ...i },
		}));
	}

	onMount(async () => {
		let fetchedOrder: Order = await api.fetchOrder(uuid);
		const fetchedCampaign: Campaign = await api.fetchCampaign(uuid);
		paid_amount = fetchedOrder.paid_amount;

		new_order = fetchedOrder == null;
		if (fetchedCampaign == null) {
			items = [];
			campaign = null;
		} else {
			// set ordered amounts
			fill_form(fetchedCampaign, fetchedOrder);
			campaign = fetchedCampaign;
		}
	});

	async function order() {
		const savedOrder = await api.orderCampaign(uuid, {
			is_new: new_order,
			items: items
				.filter((i) => i.amount > 0)
				.map((i) => ({ item_uuid: i.item.uuid, amount: i.amount })),
		});
		new_order = false;
		fill_form(campaign, savedOrder);
	}
</script>

{#if campaign == null}
	<h1>{$_("order.loading")}</h1>
{:else}
	<h1>{$_("order.title", { values: { campaign_title: campaign.title } })}</h1>

	<div class="mb-2">
		<InProgressButton
			on_click_function={async () => order()}
			label={$_("order.confirm")}
			disabled_predicate={() => totalPrice <= 0 && new_order}
		/>
	</div>
	{#if items.length === 0}
		<div>
			<span>{$_("order.no_items")}</span>
		</div>
	{/if}
	{#each items as { amount, item }}
		<div class="card mb-2" style="width: 100%;">
			<div class="card-body">
				<div class="card-title">
					<h5 class:fade-text={amount == null || amount === 0}>
						{item.ordinal}. {item.name}
						<span class="ms-2 badge bg-secondary">
							{item.price}
							{$_("currency.pln")}
						</span>
					</h5>
				</div>
				<div class="input-group card-text">
					<span class="input-group-text">{$_("order.quantity")}</span>
					<button
						type="button"
						class="btn btn-outline-secondary change-amount"
						on:click={() => amount++}
					>
						+
					</button>
					<button
						type="button"
						class="btn btn-outline-secondary change-amount"
						on:click={() => (amount = Math.max(0, amount - 1))}
					>
						-
					</button>
					<input
						type="number"
						id="amount"
						class="form-control"
						bind:value={amount}
						min="0"
					/>
				</div>
			</div>
		</div>
	{/each}

	<table>
		<thead>
			<th>nazwa</th>
			<th>liczba</th>
			<th> cena</th>
			<th>wartość</th>
		</thead>
		<tbody>
			{#each items as { amount, item }}
				<tr>
					<td>{item.name}</td><td>{amount}</td><td>{item.price}</td><td
						>{item.price * amount}</td
					>
				</tr>
			{/each}
			<tr>
				<td>Łącznie</td>
				<td />
				<td />
				<td>{totalPrice}</td>
			</tr>
			<tr>
				<td>Wpłacono</td>
				<td />
				<td />
				<td>{paid_amount}</td>
			</tr>
		</tbody>
	</table>

	<!-- 
	<table class="table">
		<thead>
			<tr>
				<th scope="col">{$_("orders_history.name")}</th>
				<th scope="col">{$_("orders_history.quantity")}</th>
				<th scope="col">{$_("orders_history.price")}</th>
				<th scope="col">{$_("orders_history.item_total")}</th>
			</tr>
		</thead>
		<tbody>
      <tr>
					<th scope="row">{i.name}</th>
					<td>{i.amount}</td>
					<td>{i.price} {$_("currency.pln")}</td>
					<td>{i.amount * i.price} {$_("currency.pln")}</td>
				</tr>
			<tr>
				<th scope="row">{$_("orders_history.total")}</th>
				<td />
				<td />
				<td>{total} {$_("currency.pln")}</td>
			</tr>
			<tr>
				<th scope="row">{$_("orders_history.paid_confirmed")}</th>
				<td />
				<td />
				<td>{item.paid_value} {$_("currency.pln")}</td>
			</tr>
			{#if to_pay > 0}
				<tr>
					<th scope="row">{$_("orders_history.left")}</th>
					<td />
					<td />
					<td class:text-danger={to_pay > 0}>
						{to_pay}
						{$_("currency.pln")}
					</td>
				</tr>
		</tbody>
	</table>
 -->
{/if}

<style>
	.fade-text {
		color: grey;
	}

	#amount {
		text-align: left;
	}

	.badge {
		vertical-align: top;
	}

	.change-amount {
		min-width: 40px;
	}
</style>
