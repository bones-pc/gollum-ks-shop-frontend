<script lang="ts">
	import { Link } from "svelte-navigator";
	import { Route, Router } from "svelte-navigator";
	import Anonymous from "./Anonymous.svelte";
	import { onMount } from "svelte";
	import { role } from "./stores";
	import { authentication_manager } from "./authentication/authentication_manager";
	import { _ } from "svelte-i18n";
	import { subscription_due_date } from "./stores";
	import { get } from "svelte/store";

	onMount(async () => {
		await authentication_manager.store_credentials_if_authenticated();
	});

	export let hide_actions = false;
	export let logout_only = false;

	async function logout() {
		await authentication_manager.logout();
	}
	let subscription_due = get(subscription_due_date);
	const sub_due_string = subscription_due?.toLocaleString().split("T")[0];
</script>

<nav class="navbar navbar-expand-lg navbar-light bg-light">
	<div class="container-fluid">
		<span class="navbar-brand nav-link">
			<Link to="/">{$_("nav.title")}</Link>
			{#if subscription_due}
				<div class="subscription_due_font">
					{$_("subscription.due_date")}
					{sub_due_string}
				</div>
			{/if}
		</span>

		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarNav"
			aria-controls="navbarNav"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon" />
		</button>
		{#if !hide_actions}
			<div class="collapse navbar-collapse" id="navbarNav">
				<ul class="navbar-nav">
					{#if $role.is_expired()}
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/orders-history">{$_("nav.orders_history")}</Link>
							</span>
						</li>

						<li class="nav-item">
							<span class="nav-link">
								<Link to="/users/profile">{$_("nav.userprofile")}</Link>
							</span>
						</li>
					{:else if !logout_only}
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/">{$_("nav.active_campaigns")}</Link>
							</span>
						</li>
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/campaigns/closed">
									{$_("nav.closed_campaigns")}
								</Link>
							</span>
						</li>
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/campaigns/archive">
									{$_("nav.archived_campaigns")}
								</Link>
							</span>
						</li>
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/drafts">
									{$_("nav.proposed_campaigns")}
								</Link>
							</span>
						</li>
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/orders-history">{$_("nav.orders_history")}</Link>
							</span>
						</li>
						<li class="nav-item">
							<span class="nav-link">
								<Link to="/users/profile">{$_("nav.userprofile")}</Link>
							</span>
						</li>
						{#if $role}
							{#if $role.is_admin()}
								<li class="nav-item">
									<span class="nav-link">
										<Link to="/users">{$_("nav.manage_users")}</Link>
									</span>
								</li>
							{/if}
						{/if}
					{/if}
				</ul>
				<div class="logout navbar-nav">
					<span class="nav-link" on:click={logout}>{$_("nav.logout")}</span>
				</div>
			</div>
		{/if}
	</div>
</nav>
<div class="mt-3" />

<style>
	:global(.nav-link > a) {
		color: inherit !important;
		text-decoration: inherit !important;
	}

	.nav-link {
		cursor: pointer;
	}

	.subscription_due_font {
		font-size: x-small;
	}

	.logout {
		display: flex;
		flex-grow: 1;
		justify-content: flex-end;
	}
</style>
