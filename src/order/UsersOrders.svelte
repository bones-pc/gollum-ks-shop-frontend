<script lang="ts">
	import AccordionUserList from "../utils/AccordionUserList.svelte";
	import type { AccordionUserItem } from "../utils/accordion_user_item";
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import { api, Campaign, CampaignStatus, User } from "../api/Api";

	let users: User[] = [];

	onMount(async () => {
		users = await api.fetchUsers();
	});

	async function activate(uuid: string) {
		const new_user = await api.activateUser(uuid);
		users[users.findIndex((it) => it.uuid === new_user.uuid)] = new_user;
	}

	async function deactivate(uuid: string) {
		const new_user = await api.deactivateUser(uuid);
		users[users.findIndex((it) => it.uuid === new_user.uuid)] = new_user;
	}
	const fetch_filter = { status: CampaignStatus.ACTIVE };

		const campaigns: Campaign[] = await api.fetchCampaigns({
			titleLike: search,
			...fetch_filter,
		});
		return campaigns.map(({ uuid, title, url, img_url }) => ({
			id: uuid,
			title,
			url,
			img_url,
		}));
	}
</script>

<h1>{$_("nav.manage_users")}</h1>

<AccordionUserList items_provider={fetch} items={[]}>
	<svelte:fragment slot="item-actions" let:item>test</svelte:fragment>
</AccordionUserList>

<table class="table">
	<thead>
		<tr>
			<th scope="col">#</th>
			<th scope="col">{$_("manage_users.username")}</th>
			<th scope="col">{$_("manage_users.actions")}</th>
		</tr>
	</thead>
	<tbody>
		{#each users as user, index}
			<tr>
				<th scope="row">{index + 1}</th>
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
