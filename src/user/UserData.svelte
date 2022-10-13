<script lang="ts">
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";
	import { _ } from "svelte-i18n";
	import type { UserProfile } from "../api/Api";
	export let user: UserProfile;

	// maybe change needed to more Svelte way ?
	function copyText(attr_id) {
		let copyText = document.getElementById(attr_id);
		copyText.select();
		copyText.setSelectionRange(0, 99999); // For mobile devices
		navigator.clipboard.writeText(copyText.value);
	}
</script>

<h1>{$_("nav.userprofile")} {user.username}</h1>

<table>
	<tr>
		<td>{$_("user_profile.username")}</td>
		<td>&nbsp;</td>
		<td>
			<input disabled class="input_copy" id="username" value={user.username} />
		</td>
	</tr>
	<tr>
		<td>{$_("user_profile.firstname")} {$_("user_profile.lastname")}</td>
		<td>&nbsp;</td>
		<td>
			<input
				class="input_copy"
				id="full_name"
				disabled
				value="{user.firstname} {user.lastname}"
			/>
		</td>
		<td>
			<button
				class="btn btn-light non-collapsing"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target
				on:click={() => {
					copyText("full_name");
				}}
			>
				<Fa icon={faCopy} primaryColor="blue" />
			</button>
		</td>
	</tr>

	<tr>
		<td>{$_("user_profile.street")}</td>
		<td>&nbsp;</td><td>
			<input disabled class="input_copy" id="street" value={user.street} />
		</td>
		<td>
			<button
				class="btn btn-light non-collapsing"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target
				on:click={() => {
					copyText("street");
				}}
			>
				<Fa icon={faCopy} primaryColor="blue" />
			</button>
		</td>
	</tr>

	<tr>
		<td>{$_("user_profile.city")}</td>
		<td>&nbsp;</td>
		<td>
			<input
				disabled
				class="input_copy"
				id="city"
				value="{user.zip} {user.city}"
			/>
		</td>
		<td>
			<button
				class="btn btn-light non-collapsing"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target
				on:click={() => {
					copyText("city");
				}}
			>
				<Fa icon={faCopy} primaryColor="blue" />
			</button>
		</td>
	</tr>
	<tr>
		<td>{$_("user_profile.inpost")}</td>
		<td>&nbsp;</td>
		<td>
			<input disabled class="input_copy" id="inpost" value={user.inpost} />
		</td>
		<td>
			<button
				class="btn btn-light non-collapsing"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target
				on:click={() => {
					copyText("inpost");
				}}
			>
				<Fa icon={faCopy} primaryColor="blue" />
			</button>
		</td>
	</tr>
</table>

<style>
	.input_copy {
		border: none;
		color: black;
		background: transparent;
		outline: none;
	}
</style>
