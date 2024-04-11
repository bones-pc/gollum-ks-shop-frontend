<script lang="ts">
	import { _ } from "svelte-i18n";
	import { onMount } from "svelte";
	import { api, User } from "../api/Api";
	import { Link } from "svelte-navigator";
	import Modal from "../utils/Modal.svelte";

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

	async function downloadCSV() {
		let download = document.getElementById("users-download");
		const csv = await api.fetchUsersInCSV();
		download.setAttribute(
			"href",
			"data:text/csv;charset=utf-8," + encodeURIComponent(csv)
		);
		download.setAttribute("download", "users.csv");
		download.click();
	}

	interface ExcelUser {
		uuid: string;
		subscription_due: Date;
	}
	let excelHelper = false;
	let excel_helper = "";
	const add_excel = async (excel_helper: string) => {
		let user: ExcelUser = {
			uuid: "",
			subscription_due: new Date("1900-10-10"),
		};
		let data = excel_helper;
		let rows = data.split("\n");
		for (const row of rows) {
			const cells = row.split("\t");
			user.uuid = cells[0];
			user.subscription_due = new Date(cells[1]);
			const result = await api.updateSubscription(
				user?.uuid,
				user?.subscription_due
			);
			console.log(cells);
		}
	};

	const onExitExcelHelper = () => {
		add_excel(excel_helper);
		excelHelper = false;
	};

	const onToggleExcelHelper = () => {
		excelHelper = !excelHelper;
	};
</script>

<Modal
	title={$_("edit_campaign.paste_items")}
	close={$_("edit_campaign.paste_items_skip")}
	action={$_("edit_campaign.paste_items_ok")}
	open={excelHelper}
	onClick={onExitExcelHelper}
	onClosed={onToggleExcelHelper}
>
	<div class="mb-3">
		<label class="form-label" for="campaign_desc">
			{$_("edit_campaign.paste_items_text")}
		</label>
		<textarea id="user_data" class="form-control" bind:value={excel_helper} />
	</div>
</Modal>

<h2>{$_("nav.manage_users")}</h2>
<div on:click={downloadCSV}>Pobierz dane użytkowników</div>
<div on:click={onToggleExcelHelper}>Wklej dane użytkowników</div>
<a id="users-download">&nbsp;</a>

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
