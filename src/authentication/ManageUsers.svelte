<script lang="ts">
	import { _ } from "svelte-i18n";
	import { onMount } from "svelte";
	import { api, User } from "../api/Api";
	import { Link } from "svelte-navigator";

	let users: User[] = [];

	onMount(async () => {
		users = await api.fetchUsers();
	});
	let toggleSortedUsername = false;
	let toggleSortedLastName = false;
	let toggleSortedFirstName = false;

	const sortByUsername = () => {
		const ascending = !toggleSortedUsername;
		toggleSortedUsername = ascending;

		users.sort((a, b) => {
			if (a.username.toLocaleLowerCase() < b.username.toLocaleLowerCase()) {
				return ascending ? 1 : -1;
			} else {
				return ascending ? -1 : 1;
			}
		});
		users = users;
	};
	const sortByName = () => {
		const ascending = !toggleSortedLastName;
		toggleSortedLastName = ascending;
		users.sort((a, b) => {
			if (a.lastname.toLocaleLowerCase() < b.lastname.toLocaleLowerCase()) {
				return ascending ? 1 : -1;
			} else {
				return ascending ? -1 : 1;
			}
		});
		users = users;
	};
	const sortByFirst = () => {
		const ascending = !toggleSortedFirstName;
		toggleSortedFirstName = ascending;
		users.sort((a, b) => {
			if (a.firstname.toLocaleLowerCase() < b.firstname.toLocaleLowerCase()) {
				return ascending ? 1 : -1;
			} else {
				return ascending ? -1 : 1;
			}
		});
		users = users;
	};

	async function activate(uuid: string) {
		const new_user = await api.activateUser(uuid);
		users[users.findIndex((it) => it.uuid === new_user.uuid)] = new_user;
	}

	async function deactivate(uuid: string) {
		const new_user = await api.deactivateUser(uuid);
		users[users.findIndex((it) => it.uuid === new_user.uuid)] = new_user;
	}
</script>

<h1>{$_("nav.manage_users")}</h1>

<table class="table">
	<thead>
		<tr>
			<th scope="col">#</th>
			<th on:click={sortByUsername} scope="col"
				>{$_("manage_users.username")}</th
			>
			<th on:click={sortByName} scope="col">{$_("user_profile.lastname")}</th>
			<th on:click={sortByFirst} scope="col">{$_("user_profile.firstname")}</th>
			<th scope="col">{$_("manage_users.actions")}</th>
		</tr>
	</thead>
	<tbody>
		{#each users as user, index}
			<tr>
				<th scope="row">{index + 1}</th>
				<td><Link to="/user-detail/{user.uuid}">{user.username}</Link></td>
				<td>
					{user.lastname == null ? "" : user.lastname}
				</td>
				<td>
					{user.firstname == null ? "" : user.firstname}
				</td>
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
							{$_("manage_users.activate")}
						</button>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	td {
		vertical-align: middle !important;
	}
</style>
