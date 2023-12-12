<script lang="ts">
	import { onMount } from "svelte";
	import { Link } from "svelte-navigator";
	import { _ } from "svelte-i18n";
	import CopyToClipboardField from "../utils/CopyToClipboardField.svelte";

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
	let totalCampaignItems = [];
	let totalGathered = 0;
	let totalPrice = 0;
	let tracking_no = "";

	let admin_addons = [];

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
			totalCampaignItems = campaign.items.map((item) => ({
				...item,
				total_amount: itemOccurrences.get(item.uuid) ?? 0,
			}));

			totalItems = totalCampaignItems.filter((item) => item.total_amount > 0);
			totalPrice = totalItems.reduce(
				(acc, item) => acc + item.total_amount * item.price,
				0
			);
			totalGathered = orders.reduce((acc, order) => acc + order.paid_amount, 0);

			admin_addons = totalCampaignItems.filter((ti) => {
				for (let oi of campaign.items) {
					if (ti.uuid === oi.uuid && oi.type === OrderedItemType.ADMIN_ADDON)
						return ti;
				}
			});
		}
	}

	function addAdminOrder(addon) {
		const empty_addon: OrderedItem = {
			item_uuid: addon.uuid,
			amount: 1,
			ordinal: 0,
			ouuid: "",
			item_type: OrderedItemType.PLEDGE,
		};

		for (let order of orders) {
			if (order.items.filter((v) => v.item_uuid == addon.uuid).length == 0)
				order.items = [...order.items, empty_addon];
			// order.items = [...order.items, { amount: 1, item_uuid: addon.uuid }];
		}
		orders.forEach(async (order) => {
			await change_order(campaign.uuid, order.ouuid, order.items);
		});

		orders = orders;
		campaign = campaign;
	}

	async function change_order(
		campaign_uuid: string,
		owner_uuid: string,
		items: OrderedItemAdmin[]
	) {
		const savedOrder = await api.patchOrder(campaign_uuid, owner_uuid, items);
		totalItems = totalItems;
		orders = orders;
		campaign = campaign;
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
	async function downloadCSV() {
		let output_csv = "";
		let legenda = "\r\n\r\n";
		let first_row = ",,,,ceny:,";
		let row = "Nazwisko Imię,login,zapłacone,do zaplaty,data_zamowienia,";
		campaign.items.forEach((item) => {
			legenda += `${item.ordinal},` + `${item.name}\r\n`;
			first_row += `${item.price},`;
			row += `${item.ordinal},`;
		});
		row += "\r\n";
		output_csv += first_row + "\r\n";
		for (let i = 0; i < orders.length; i++) {
			let ppl = orders[i];
			let ppl_orders = ppl.items;

			let pledges_txt = "";
			let to_pay = 0;
			campaign.items.forEach((pledge) => {
				let ordered_items = ppl_orders.filter(
					(ordered) => pledge.uuid === ordered.item_uuid
				);
				if (ordered_items.length) {
					pledges_txt += `${ordered_items[0].amount},`;
					to_pay += pledge.price * ordered_items[0].amount;
				} else {
					pledges_txt += "0,";
				}
			});
			row += `"${ppl.lastname} ${ppl.firstname}",`;
			row += `"${ppl.username}",`;
			row += `"${ppl.paid_amount}",`;
			row += `${to_pay},`;
			// row += `"${ppl.order_date.toDateString().split("T")[0]}",`;
			row += `"${ppl.order_date.split("T")[0]}",`;
			row += pledges_txt;
			row += "\r\n";
			output_csv += row;
			row = "";
		}
		output_csv += legenda;
		let download = document.getElementById("download");
		download.setAttribute(
			"href",
			"data:text/csv;charset=utf-8," + encodeURIComponent(output_csv)
		);
		download.setAttribute("download", "test.csv");
		download.click();
	}

	onMount(async () => {
		const [o, c] = await Promise.all([
			api.fetchCampaignOrders(uuid),
			api.fetchCampaign(uuid),
		]);
		orders = o.sort(sort_by_order_date);
		admin_addons = c.items.filter((v) => v.type == OrderedItemType.ADMIN_ADDON);
		campaign = c;
		console.log(c);
		console.log(o);
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
	<div class="row">
		<div class="col-md-3 mid">
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
		<div class="col-md-2 mid">
			<InProgressButton on_click_function={downloadCSV} label="Ściągnij CSV" />
		</div>
	</div>
	<a id="download">&nbsp;</a>

	<div>
		Tytuł przelewu: <CopyToClipboardField
			copy_value={campaign.payment_details}
		/>
	</div>
	<div>
		Dodatkowe koszty:
		<ul>
			{#each admin_addons as addon}
				<li>
					{addon.name}: {addon.total_amount}
					<button
						class="btn btn-outline-secondary change-amount"
						on:click={() => addAdminOrder(addon)}>+</button
					>
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
				label="Zapisz"
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
				{#if item.amount > 0}
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
				{/if}
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
</style>
