<script lang="ts">
	import { _ } from "svelte-i18n";

	import {
		api,
		Campaign,
		CampaignItem,
		CampaignStatus,
		ErrorResponse,
		ResponseStatusCode,
	} from "../api/Api";
	import AccordionList from "../utils/AccordionList.svelte";
	import type { AccordionItem } from "../utils/accordion_item";
	import { useNavigate } from "svelte-navigator";
	import { Toast } from "bootstrap";
	import SimpleToast from "../utils/SimpleToast.svelte";
	import InProgressButton from "../utils/InProgressButton.svelte";

	const navigate = useNavigate();

	interface PastItem {
		name: string;
		price: number;
		amount: number;
	}

	interface PastOrder {
		campaign_title: string;
		paid_value: number;
		user_paid: number;
		order_value: number;
		items: PastItem[];
		campaign_uuid: string;
	}

	type OrderPosition = PastOrder & AccordionItem;

	let toast_message = "";
	let toast_id = "orders_toast";
	function showToast() {
		let my_toast_el = document.getElementById(toast_id);
		let toast = new Toast(my_toast_el);
		toast.show();
	}

	async function fetch(
		search: string
	): Promise<OrderPosition[] | ErrorResponse> {
		const fetched_orders = await api.fetchUserOrders();

		toast_message = "Zaktualizowane!";
		if (
			(fetched_orders as ErrorResponse)?.status_code ===
			ResponseStatusCode.NOT_ALLOWED
		) {
			toast_message = "Brak uprawnień";
			showToast();
			setTimeout(() => {
				navigate("/");
			}, 2000);
			return [];
		}
		const fetched_campaigns = await api.fetchCampaigns({
			uuids: fetched_orders.map((it) => it.campaign_uuid),
			titleLike: search,
		});
		const uuid_to_campaign = new Map<string, Campaign>(
			fetched_campaigns.map((it) => [it.uuid, it])
		);
		const new_orders: OrderPosition[] | ErrorResponse = [];
		for (const o of fetched_orders) {
			const c = uuid_to_campaign.get(o.campaign_uuid);
			if (c == null) {
				continue;
			}
			const uuid_to_item = new Map<string, CampaignItem>(
				c.items.map((it) => [it.uuid, it])
			);
			const items = o.items.map((it) => {
				const { name, price } = uuid_to_item.get(it.item_uuid);
				return { name, price, amount: it.amount };
			});
			const order_value = items.reduce((acc, i) => acc + i.price * i.amount, 0);
			new_orders.push({
				campaign_title: c.title,
				paid_value: o.paid_amount,
				order_value,
				items,
				title: c.title,
				id: c.uuid,
				img_url: c.img_url,
				campaign_uuid: c.uuid,
				purchased: false,
				status: c.status,
				user_paid: o.user_paid,
			});
		}
		console.log(new_orders);
		return new_orders;
	}

	let new_order = null;
	let showPopup = false;
	let title = "";
	let totalPrice = 0;
	let user_paid = 0;

	async function update_amount(uuid, amount, campaign_title) {
		showPopup = true;
		title = campaign_title;
		const savedOrder = await api.updateUserPaidAmount(uuid, amount);
		console.log(savedOrder);
		if (
			(savedOrder as ErrorResponse).status_code ===
			ResponseStatusCode.NOT_ALLOWED
		) {
			toast_message = (savedOrder as ErrorResponse).message;
			showToast();
			return;
		} else {
			new_order = false;
			// fill_form(campaign, savedOrder);
		}
	}
</script>

<h1>{$_("orders_history.title")}</h1>

<AccordionList items_provider={fetch}>
	<svelte:fragment slot="title" let:item>
		{#if item.status === CampaignStatus.ARCHIVED}
			<span class="badge bg-warning">Wysłane</span>
		{/if}
		{#if item.paid_value == 0}
			<span class="badge bg-danger">{$_("orders_history.unpaid")}</span>
		{:else if item.paid_value < item.order_value}
			<span class="badge bg-warning">
				{$_("orders_history.partially_paid")}
			</span>
		{:else if item.paid_value > item.order_value}
			<span class="badge bg-info">
				{$_("orders_history.overpaid")}
			</span>
		{:else if item.paid_value === undefined}
			<span />
		{:else}
			<span class="badge bg-success">{$_("orders_history.paid")}</span>
		{/if}
		<div class="ms-3">
			{#if item.status === CampaignStatus.CLOSED || item.status === CampaignStatus.ARCHIVED}
				{item.title}
			{:else}
				<a href={"#"} on:click={() => navigate(`/order/${item.campaign_uuid}`)}>
					{item.title}
				</a>
			{/if}
		</div>
	</svelte:fragment>
	<div slot="item-actions" let:item>
		{@const total = item.items.reduce(
			(acc, it) => acc + it.amount * it.price,
			0
		)}
		{@const to_pay = total - item.paid_value}

		<div class="mb-2">
			Moje wpłaty:
			<input
				id={"user_paid" + item.id}
				type="number"
				placeholder="wpisz informacyjnie dla siebie"
				value={item.user_paid}
			/>
			<InProgressButton
				on_click_function={async () => {
					item.user_paid = document.getElementById("user_paid" + item.id).value;
					update_amount(item.id, item.user_paid, item.title);
				}}
				label={"Dodaj wpłatę."}
				disabled_predicate={() => totalPrice <= 0 && new_order}
			/>
		</div>
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
				{#each item.items as i}
					<tr>
						<th scope="row">{i.name}</th>
						<td>{i.amount}</td>
						<td>{i.price} {$_("currency.pln")}</td>
						<td>{i.amount * i.price} {$_("currency.pln")}</td>
					</tr>
				{/each}
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
				{/if}
			</tbody>
		</table>
	</div>
</AccordionList>
<SimpleToast {toast_id}
	><div slot="toast-body">{toast_message}</div></SimpleToast
>

<style>
	.badge {
		text-transform: uppercase;
	}
	th {
		text-decoration: none !important;
		font-weight: normal !important;
	}
</style>
