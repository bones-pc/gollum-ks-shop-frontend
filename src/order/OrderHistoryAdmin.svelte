<script lang="ts">
	import { _ } from "svelte-i18n";
	import {
		api,
		AssignedToUser,
		Campaign,
		CampaignItem,
		Order,
		OrderStatus,
	} from "../api/Api";
	import AccordionList from "../utils/AccordionList.svelte";
	import type { AccordionItem } from "../utils/accordion_item";
	import InProgressButton from "../utils/InProgressButton.svelte";

	export let uuid: string;
	interface PastItem {
		name: string;
		price: number;
		amount: number;
	}

	interface PastOrder {
		campaign_title: string;
		paid_value: number;
		order_value: number;
		order_uuid: string;
		items: PastItem[];
	}

	interface PaidAmount {
		paid_amount: number;
		campaign_uuid: string;
		order_uuid: string;
	}
	let paid_value;
	async function confirm(paid: PaidAmount) {
		console.log(paid);
		const order: Order & AssignedToUser = {
			...paid,
			items: [],
			order_date: new Date(),
			tracking_no: "",
			status: OrderStatus.ACTIVE,
			ouuid: "",
			username: "",
			firstname: "",
			lastname: "",
		};
		await api.updatePaidAmount(order);
	}

	async function fetch(search: string): Promise<(PastOrder & AccordionItem)[]> {
		const fetched_orders = await api.fetchUserOrdersAdmin(uuid);
		console.log(fetched_orders);
		const fetched_campaigns = await api.fetchCampaigns({
			uuids: fetched_orders.map((it) => it.campaign_uuid),
			titleLike: search,
		});

		const uuid_to_campaign = new Map<string, Campaign>(
			fetched_campaigns.map((it) => [it.uuid, it])
		);
		const new_orders: (PastOrder & AccordionItem)[] = [];
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
				status: c.status,
				order_value,
				items,
				title: c.title,
				id: c.uuid,
				img_url: c.img_url,
				order_uuid: o.order_uuid,
				purchased: false,
			});
		}
		return new_orders;
	}
	let temp_delete = new Set();

	async function delete_user_order(
		user_uuid: string,
		campaiagn_uuid: string,
		order_uuid: string
	) {
		let result = await api.changeUserOrderStatus(
			user_uuid,
			campaiagn_uuid,
			order_uuid,
			OrderStatus.DELETED
		);
		temp_delete.add(order_uuid);
		return result.status;
	}
</script>

<AccordionList items_provider={fetch}>
	<svelte:fragment slot="title" let:item>
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
			{#if item.url == null}
				{item.title}
			{:else}
				<a href={item.url} target="_blank">{item.title}</a>
			{/if}
		</div>
	</svelte:fragment>
	<div slot="item-actions" let:item>
		<button
			id={item.id}
			type="button"
			class="btn btn-success"
			on:click={(e) => {
				item.status = delete_user_order(uuid, item.id, item.order_uuid);
				const node = e.currentTarget;
				node.disabled = true;
				node.innerText = "Skasowane";
			}}
		>
			{$_("manage_orders.delete_user_order")}
		</button>

		{@const total = item.items.reduce(
			(acc, it) => acc + it.amount * it.price,
			0
		)}
		{@const to_pay = total - item.paid_value}
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
						<td>
							<input class="paid_edit" disabled value={i.amount * i.price} />
							{$_("currency.pln")}</td
						>
					</tr>
				{/each}
				<tr>
					<th scope="row">{$_("orders_history.total")}</th>
					<td />
					<td />
					<td>
						<input class="paid_edit" disabled value={total} />
						{$_("currency.pln")}</td
					>
				</tr>
				<tr>
					<th scope="row">{$_("orders_history.paid_confirmed")}</th>
					<td />
					<td />
					<td>
						<!-- {item.paid_value} -->
						<input
							class="paid_edit"
							id={"paid" + item.id}
							value={item.paid_value}
						/>
						{$_("currency.pln")}<InProgressButton
							on_click_function={async () => {
								paid_value = document.getElementById("paid" + item.id).value;
								const paid_item = {
									paid_amount: paid_value,
									campaign_uuid: item.id,
									order_uuid: item.order_uuid,
								};
								confirm(paid_item);
							}}
							label="Zapisz"
						/>
					</td>
				</tr>
				{#if to_pay > 0}
					<tr>
						<th scope="row">{$_("orders_history.left")}</th>
						<td />
						<td />
						<td class:text-danger={to_pay > 0}>
							<input class="paid_edit" disabled value={to_pay} />
							{$_("currency.pln")}
						</td>
					</tr>
				{:else if to_pay < 0}
					<tr>
						<th scope="row">{$_("orders_history.overpaid")}</th>
						<td />
						<td />
						<td class:text-danger={to_pay > 0}>
							<b>
								{to_pay}
								{$_("currency.pln")}
							</b>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</AccordionList>

<style>
	.badge {
		text-transform: uppercase;
	}

	th {
		text-decoration: none !important;
		font-weight: normal !important;
	}
	.paid_edit {
		border: none;
		color: black;
		background: transparent;
		outline: none;
		width: 30%;
	}
</style>
