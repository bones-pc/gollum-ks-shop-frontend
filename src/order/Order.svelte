<script lang="ts">
	import { Toast } from "bootstrap";
	import { marked } from "marked";
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import {
		api,
		Campaign,
		CampaignStatus,
		Order,
		OrderedItem,
		OrderedItemType,
	} from "../api/Api";
	import InProgressButton from "../utils/InProgressButton.svelte";
	import SimpleToast from "../utils/SimpleToast.svelte";
	import CopyToClipboardField from "../utils/CopyToClipboardField.svelte";
	import Fa from "svelte-fa";
	import { faHeart } from "@fortawesome/free-solid-svg-icons";
	import { faHeart as faHeartOpen } from "@fortawesome/free-regular-svg-icons";
	import Modal from "../utils/Modal.svelte";
	import { role, user_uuid } from "../stores";

	export let uuid: string;

	let campaign: Campaign = null;
	let campaignStatus: CampaignStatus = CampaignStatus.ACTIVE;
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
			old_amount: orderItems.get(i.uuid)?.amount ?? 0,
			item: { ...i },
		}));
	}

	const onClickOK = () => {
		showPopup = false;
	};
	const onPopupClose = () => {
		showPopup = false;
	};

	async function like(candidate_uuid: string) {
		await api.likeCandidate(candidate_uuid);
		campaign.liked = true;
		campaign.likes++;
	}

	async function unlike(candidate_uuid: string) {
		await api.unlikeCandidate(candidate_uuid);
		campaign.liked = false;
		campaign.likes--;
	}

	onMount(async () => {
		let fetchedCampaign: Campaign = await api.fetchCampaign(uuid);
		campaignStatus = fetchedCampaign.status;
		if (fetchedCampaign.liking_users.includes($user_uuid))
			fetchedCampaign.liked = true;
		else fetchedCampaign.liked = false;

		let fetchedOrder: Order = await api.fetchOrder(uuid);
		const new_items = fetchedOrder?.items.map((i) => {
			const item_type = fetchedCampaign.items.filter(
				(v) => v.uuid === i.item_uuid
			);
			return { ...i, type: item_type[0].type, old_amount: i.amount };
		});
		if (fetchedOrder) {
			paid_amount = fetchedOrder.paid_amount;
		}
		new_order = fetchedOrder == null;
		if (!new_order) {
			fetchedOrder.items = new_items;
		}

		if (fetchedCampaign == null) {
			items = [];
			campaign = null;
		} else {
			// set ordered amounts
			fill_form(fetchedCampaign, fetchedOrder);
			campaign = fetchedCampaign;
		}
		user_paid = fetchedOrder?.user_paid | 0;
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
			{#if campaignStatus == CampaignStatus.CLOSED}
				<span class="badge bg-danger">Zamknięta</span>
			{/if}
			{@html marked(campaign.description)}
			<div>
				Tytuł przelewu: <CopyToClipboardField
					copy_value={campaign.payment_details}
				/>
			</div>

			{#if campaign.liked}
				<button
					class="btn btn-light non-collapsing"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target
					on:click={() => unlike(campaign.uuid)}
				>
					<Fa icon={faHeart} primaryColor="red" />
					{$_(
						campaign.likes === 1
							? "proposed_campaigns.single_like"
							: "proposed_campaigns.likes",
						{ values: { count: campaign.likes } }
					)}
				</button>
			{:else}
				<button
					class="btn btn-light non-collapsing"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target
					on:click={() => like(campaign.uuid)}
				>
					<Fa icon={faHeartOpen} />
					{$_(
						campaign.likes === 1
							? "proposed_campaigns.single_like"
							: "proposed_campaigns.likes",
						{ values: { count: campaign.likes } }
					)}
				</button>
			{/if}
			<div>Data końca zbiórki: {campaign.due_date}</div>
			{#if campaign.end_date}<div>
					Data zamknięcia Kickstartera: {campaign.end_date}
				</div>{/if}
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

	{#if campaignStatus != CampaignStatus.CLOSED}
		{#if items.length === 0}
			<div>
				<span>{$_("order.no_items")}</span>
			</div>
		{/if}
		{#each items as { amount, old_amount, item }}
			{#if item.type !== OrderedItemType.ADMIN_ADDON || amount > 0}
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
								{#if item.type !== OrderedItemType.ADMIN_ADDON}
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
										on:click={() => {
											amount = Math.max(old_amount, amount - 1);
											if (amount == old_amount) {
												showToast(
													"Dlaczego nie mogę zmniejszać? Na podstawie Twojej wcześnijeszej deklaracji negocjuję ceny... skontaktuj się z bezpośrednio, coś się wymyśli..."
												);
											}
										}}
									>
										-
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
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
