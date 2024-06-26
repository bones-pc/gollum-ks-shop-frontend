<script lang="ts">
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";
	import { Route, Router, useParams } from "svelte-navigator";
	import Anonymous from "./Anonymous.svelte";
	import { authentication_manager } from "./authentication/authentication_manager";
	import Login from "./authentication/Login.svelte";
	import ManageUsers from "./authentication/ManageUsers.svelte";
	import UserProfile from "./authentication/UserProfile.svelte";
	import UserDetail from "./user/UserDetail.svelte";
	import SignUp from "./authentication/SignUp.svelte";
	import AddNewCampaign from "./campaign/modification/AddNewCampaign.svelte";
	import CampaignsCandidates from "./campaign/listing/CampaignsCandidates.svelte";
	import ChangeDraftToCampaign from "./campaign/modification/ChangeDraftToCampaign.svelte";
	import EditExistingCampaign from "./campaign/modification/EditExistingCampaign.svelte";
	import EditCampaignCandidate from "./campaign/modification/EditCampaignCandidate.svelte";
	import InactiveCampaigns from "./campaign/listing/InactiveCampaigns.svelte";
	import ActiveCampaigns from "./campaign/listing/ActiveCampaigns.svelte";
	import AddDraft from "./campaign/modification/AddDraft.svelte";
	import Navigation from "./Navigation.svelte";
	import ManageOrders from "./order/ManageOrders.svelte";
	import Order from "./order/Order.svelte";
	import OrdersHistory from "./order/OrdersHistory.svelte";
	import { role } from "./stores";
	import ClosedCampaigns from "./campaign/listing/ClosedCampaigns.svelte";
	import UserPasswordReset from "./authentication/UserPasswordReset.svelte";
	import UserPasswordResetInit from "./authentication/UserPasswordResetInit.svelte";
	import Footer from "./Footer.svelte";
	import { permissions } from "./authentication/roles";

	onMount(async () => {
		await authentication_manager.store_credentials_if_authenticated();
	});
</script>

<svelte:head>
	<title>{$_("nav.title")}</title>
</svelte:head>
<Router>
	<div class="container">
		{#if $role == null}
			<Navigation hide_actions={true} />
			<Route path="/signup">
				<SignUp />
			</Route>
			<Route path="/forgot/:a/:b/:c" let:params>
				<UserPasswordReset a={params.a} b={params.b} c={params.c} />
			</Route>

			<Route path="/password-reset">
				<UserPasswordResetInit />
			</Route>

			<Route path="/*">
				<Login />
			</Route>
		{:else if $role.is_anonymous()}
			<Navigation logout_only={true} />
			<Anonymous />
		{:else if $role.is_expired()}
			<Navigation hide_actions={false} />
			<Route path="/orders-history">
				<OrdersHistory />
			</Route>
			<Route path="/users/profile">
				<UserProfile />
			</Route>
		{:else}
			<Navigation />
			<Route path="/">
				<ActiveCampaigns />
			</Route>
			<Route path="/campaigns/closed">
				<ClosedCampaigns />
			</Route>
			<Route path="/campaigns/archive">
				<InactiveCampaigns />
			</Route>
			<Route path="/order/:uuid" let:params>
				<Order uuid={params.uuid} />
			</Route>
			<Route path="/orders-history">
				<OrdersHistory />
			</Route>
			<Route path="/drafts">
				<CampaignsCandidates />
			</Route>
			<Route path="/new-draft">
				<AddDraft />
			</Route>
			<Route path="/users/profile">
				<UserProfile />
			</Route>
			<Route path="/campaigns/add">
				<AddNewCampaign />
			</Route>

			{#if $role.check_role(permissions.campaign.CREATE)}
				<Route path="/campaigns/add/:uuid" let:params>
					<ChangeDraftToCampaign candidate_uuid={params.uuid} />
				</Route>
			{/if}
			{#if $role.check_role(permissions.campaign.UPDATE)}
				<Route path="/campaigns/candidate/edit/:uuid" let:params>
					<EditCampaignCandidate candidate_uuid={params.uuid} />
				</Route>
			{/if}
			{#if $role.check_role(permissions.campaign.UPDATE)}
				<Route path="/campaigns/edit/:uuid" let:params>
					<EditExistingCampaign uuid={params.uuid} />
				</Route>
			{/if}
			{#if $role.check_role(permissions.orders.READ)}
				<Route path="/orders/:uuid" let:params>
					<ManageOrders uuid={params.uuid} />
				</Route>
			{/if}
			{#if $role.check_role(permissions.user.UPDATE)}
				<Route path="/users">
					<ManageUsers />
				</Route>
			{/if}
			{#if $role.check_role(permissions.campaign.UPDATE)}
				<Route path="/user-detail/:uuid" let:params>
					<UserDetail uuid={params.uuid} />
				</Route>
			{/if}
		{/if}
		<Footer />
	</div>
</Router>

<style>
	:global(.fake-link) {
		cursor: pointer;
		color: #0d6efd;
		text-decoration: underline;
	}

	:global(a:visited) {
		color: #0d6efd;
	}

	:global(h1) {
		text-align: center;
	}

	:global(.campaigns-row ul) {
		padding-left: 0rem;
		list-style-type: none;
		margin-bottom: 0px;
	}
</style>
