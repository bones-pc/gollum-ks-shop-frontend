<script lang="ts">
	import { Toast } from "bootstrap";
	import { marked } from "marked";
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import {
		api,
		Campaign,
		Order,
		OrderedItem,
		OrderedItemType,
	} from "../api/Api";
	import InProgressButton from "../utils/InProgressButton.svelte";
	import SimpleToast from "../utils/SimpleToast.svelte";
	import CopyToClipboardField from "../utils/CopyToClipboardField.svelte";
	import Fa from "svelte-fa";
	import { faHeart } from "@fortawesome/free-solid-svg-icons";
	import Modal from "../utils/Modal.svelte";

	export let uuid: string;

	let campaign: Campaign = null;
	let items = [];
	let new_order = null;
	let paid_amount = 0;
	let user_paid = 0;
	let showPopup = false;
	$: totalPrice = items
		.map((i) => i.item.price * i.amount)
		.reduce((acc, x) => acc + x, 0);

	let toast_body = "Zamówienie złożone.";
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

	const onClickOK = () => {
		showPopup = false;
	};
	const onPopupClose = () => {
		showPopup = false;
	};

	onMount(async () => {
		let fetchedOrder: Order = await api.fetchOrder(uuid);
		let fetchedCampaign: Campaign = await api.fetchCampaign(uuid);
		fetchedCampaign.items = fetchedCampaign.items.filter(
			(v) => v.type != OrderedItemType.ADMIN_ADDON
		);
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
		user_paid = fetchedOrder.user_paid;
		console.log(user_paid);
	});

	async function order() {
		showPopup = true;
		let items_temp = items
			.filter((i) => i.amount > 0)
			.map((i) => ({ item_uuid: i.item.uuid, amount: i.amount }));
		const savedOrder = await api.orderCampaign(
			uuid,
			{
				is_new: new_order,
				items: items
					.filter((i) => i.amount > 0)
					.map((i) => ({ item_uuid: i.item.uuid, amount: i.amount })),
			},
			user_paid
		);
		if (savedOrder.status_code === 409) {
			showToast(savedOrder.message);
			return;
		} else {
			new_order = false;
			fill_form(campaign, savedOrder);
		}
		// showToast("Zamówienie złożone");
	}

	let toast_id = "order_toast";
	function showToast(message: string) {
		toast_body = message;
		let my_toast_el = document.getElementById(toast_id);
		let toast = new Toast(my_toast_el);
		toast.show();
	}
</script>

{#if campaign == null}
	<h1>{$_("order.loading")}</h1>
{:else}
	<h1>
		{$_("order.title", { values: { campaign_title: campaign.title } })}
	</h1>
	<div class="img-responsive row mb-2">
		<div class="col-12 col-md-4">
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
		<div class="col py-3 py-md-0">
			{@html marked(campaign.description)}
			<div>
				Tytuł przelewu: <CopyToClipboardField
					copy_value={campaign.payment_details}
				/>
			</div>
			<Fa icon={faHeart} primaryColor="red" />
			{campaign.likes} polubień.
			<div>Data końca zbiórki: {campaign.due_date}</div>
		</div>
	</div>

	<div class="mb-2">
		Moje wpłaty:
		<input
			name="user_paid"
			type="number"
			placeholder="wpisz informacyjnie dla siebie"
			bind:value={user_paid}
		/>
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
		<div
			class="card mb-2"
			style="width: 100%;"
			class:selected_item={amount > 0}
		>
			<div class="card-body row">
				<div class="col-12 col-lg">
					<h5 class:fade-text={amount == null || amount === 0}>
						{#if item.ordinal > 0}
							{item.ordinal}. {item.name}
							<span class="ms-2 badge bg-secondary">
								{item.price}
								{$_("currency.pln")}
							</span>
						{:else}
							{item.name}
							<span class="ms-2 badge bg-secondary">
								{item.price}
								{$_("currency.pln")}
							</span>
						{/if}
					</h5>
				</div>
				<div class="col-12 col-lg-4">
					<div class="input-group justify-content-lg-end">
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
						<span class="input-group-text amount">{amount}</span>
						<button
							type="button"
							class="btn btn-outline-secondary change-amount"
							on:click={() => (amount = Math.max(0, amount - 1))}
						>
							-
						</button>
					</div>
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

<SimpleToast {toast_id}>
	<div slot="toast-body">{toast_body}</div></SimpleToast
>

<Modal
	title={"Yay!"}
	action={"Cool."}
	small={true}
	open={showPopup}
	onClick={() => onClickOK()}
	onClosed={() => onPopupClose()}
>
	Zamówione: {campaign.title}.
</Modal>

<style>
	.fade-text {
		color: grey;
	}

	.amount {
		border: 1px solid #ced4da;
		background-color: white;
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
		background-color: white;
		border: 1px solid #ced4da;
	}

	img {
		width: 100%;
	}

	.selected_item {
		background-color: rgba(25, 135, 84, 0.1) !important;
	}
</style>
