<script lang="ts">
	import { onMount } from "svelte";
	import { Link, useNavigate } from "svelte-navigator";
	import { _ } from "svelte-i18n";
	import { api, Order } from "../api/Api";
	import type { UserProfile } from "../api/Api";
	import UserProfileComponent from "./UserProfile.svelte";
	import OrderHistoryAdmin from "../order/OrderHistoryAdmin.svelte";

	let user: UserProfile = {
		firstname: "",
		lastname: "",
		inpost: "",
		zip: "",
		activated: false,
		uuid: "",
		username: "",
		phone: "",
		email: "",
		street: "",
		city: "",
	};
	let orders: Order[] = [];

	export let uuid: string;

	onMount(async () => {
		user = await api.fetchUserProfileAdmin(uuid);
		console.log(user);
	});

	async function activate(uuid: string) {
		const new_user = await api.activateUser(uuid);
		// users[users.findIndex((it) => it.uuid === new_user.uuid)] = new_user;
	}

	async function deactivate(uuid: string) {
		const new_user = await api.deactivateUser(uuid);
		// users[users.findIndex((it) => it.uuid === new_user.uuid)] = new_user;
	}

	let index = 1;
</script>

<!-- <h1>profil użytkownika {$_("nav.manage_users")}</h1> -->
<h1>{$_("nav.user_orders")}: {user.username}</h1>

<table class="table">
	<thead>
		<tr>
			<th scope="col">{$_("manage_users.name")}</th>
			<th scope="col">{$_("manage_users.username")}</th>
			<th scope="col">{$_("manage_users.actions")}</th>
			<th />
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>
				{user.lastname == null ? "" : user.lastname}
				{user.firstname == null ? "" : user.firstname}
			</td>
			<td>{user.username}</td>
			<td>
				{#if user.activated}
					<button
						type="button"
						class="btn btn-warning"
						on:click={() => deactivate(user.uuid)}
					>
						{$_("manage_users.deactivate")}
					</button>
				{:else}
					<button
						type="button"
						class="btn btn-success"
						on:click={() => activate(user.uuid)}
					>
						{$_("manage_users.activate")} User
					</button>
				{/if}
			</td>
		</tr>

		<tr>
			<td colspan="4">
				<button
					class="accordion-button collapsed"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target={"#collapse" + index + "a"}
					aria-expanded="true"
					aria-controls={"collapse" + index + "a"}
				>
					{$_("manage_orders.profile")}</button
				>
				<div id={"collapse" + index + "a"} class="accordion-collapse collapse">
					<UserProfileComponent {user} />
				</div>
				<div>
					<button class="accordion-button collapsed" type="button">
						{$_("manage_orders.orders")}</button
					>
					<div id={"collapse" + index + "b"}>
						<OrderHistoryAdmin {uuid} />
					</div>
				</div>
			</td>
		</tr>
	</tbody>
</table>

<style>
	td {
		vertical-align: middle !important;
	}

	.accordion-button {
		width: none !important;
		flex: 1;
	}

	.accordion-button:focus {
		box-shadow: none !important;
	}
</style>
