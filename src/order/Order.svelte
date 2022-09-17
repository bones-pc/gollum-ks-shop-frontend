<script lang="ts">
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";

	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";

	import { api, Order, Campaign, OrderedItem } from "../api/Api";
	import InProgressButton from "../utils/InProgressButton.svelte";
	import ManageOrders from "./ManageOrders.svelte";
	import { faMaximize } from "@fortawesome/free-solid-svg-icons";

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
		if (fetchedOrder) {
			paid_amount = fetchedOrder.paid_amount;
		}
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

	// maybe change needed to more Svelte way ?
	function copyText() {
		let copyText = document.getElementById("payment_detail");
		copyText.select();
		copyText.setSelectionRange(0, 99999); // For mobile devices
		navigator.clipboard.writeText(copyText.value);
	}
</script>

{#if campaign == null}
	<h1>{$_("order.loading")}</h1>
{:else}
	<h1>{$_("order.title", { values: { campaign_title: campaign.title } })}</h1>

	<div class="mb-2 img-responsive row  offset-md-2">
		{#if campaign.url == null}
			<img
				class="accordion-list-item img-fluid"
				src={campaign.img_url}
				alt="item miniature"
			/>
		{:else}
			<a href={campaign.url} target="_blank">
				<img
					class="accordion-list-item img-fluid"
					src={campaign.img_url}
					alt="item miniature"
				/>
			</a>
		{/if}
	</div>

	<div class="mb-2 row offset-md-2">{campaign.description}</div>
	<div class="mb-2 row offset-md-2">
		<div>
			Tyluł przelewu:
			<input
				class="input_copy"
				id="payment_detail"
				readonly="readonly"
				value={campaign.payment_details}
			/>
			<button
				class="btn btn-light non-collapsing"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target
				on:click={() => copyText()}
				><Fa icon={faCopy} primaryColor="blue" /></button
			>
		</div>
	</div>

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
						{#if item.ordinal > 0}
							{item.ordinal}. {item.name}
							<span class="ms-2 badge bg-secondary">
								{item.price}
								{$_("currency.pln")}
							</span>
						{:else}
							&nbsp;&nbsp;&nbsp;&nbsp;{item.name}
							<span class="ms-2 badge bg-secondary">
								{item.price}
								{$_("currency.pln")}
							</span>
						{/if}
					</h5>
				</div>
				<div class="input-group card-text">
					<span class="input-group-text">{$_("order.quantity")}</span>
					<button
						type="button"
						class="btn btn-outline-secondary change-amount"
						on:click={() => {
							if (!item.ordinal) {
								amount == 0 ? amount++ : amount;
							} else amount++;
						}}
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

	{@const to_pay = totalPrice - paid_amount}
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
			{#each items as { amount, item }}
				{#if amount != 0}
					<tr>
						<th scope="row">{item.name}</th>
						<td>{amount}</td>
						<td>{item.price}</td>
						<td>{item.price * amount}</td>
					</tr>
				{/if}
			{/each}
			<tr>
				<th scope="row">{$_("orders_history.total")}</th>
				<td />
				<td />
				<td>{totalPrice} {$_("currency.pln")}</td>
			</tr>
			<tr>
				<th scope="row">{$_("orders_history.paid_confirmed")}</th>
				<td />
				<td />
				<td>{paid_amount}</td>
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
			{/if}
		</tbody>
	</table>
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
	.input_copy {
		border: none;
		font-weight: bold;
		background: transparent;
		outline: none;
	}
	.change-amount {
		min-width: 40px;
	}

	img {
		width: 400px;
		/* height: 159px; */
		object-fit: cover;
		overflow: hidden;
		float: left;
		font-size: 1rem;
		line-height: 26px;
		text-align: center;
	}
</style>
