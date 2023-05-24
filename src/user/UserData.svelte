<script lang="ts">
	import { _ } from "svelte-i18n";
	import type { UserProfile } from "../api/Api";
	import CopyToClipboardField from "../utils/CopyToClipboardField.svelte";
	export let user: UserProfile;

	// maybe change needed to more Svelte way ?
	function copyText(attr_id) {
		let copyText:HTMLInputElement = document.getElementById(attr_id);
		copyText.select();
		copyText.setSelectionRange(0, 99999); // For mobile devices
		navigator.clipboard.writeText(copyText.value);
	}
</script>

<h1>{$_("nav.userprofile")} {user.username}</h1>
<div class="containers">
	<table>
		<tr>
			<td>{$_("user_profile.username")}</td>
			<td>&nbsp;</td>
			<td>
				<input
					disabled
					class="input_copy"
					id="username"
					value={user.username}
				/>
			</td>
		</tr>
		<tr>
			<td>{$_("user_profile.firstname")} {$_("user_profile.lastname")}</td>
			<td>&nbsp;</td>
			<td>
				<CopyToClipboardField
					copy_value={user.firstname + " " + user.lastname}
				/>
			</td>
		</tr>

		<tr>
			<td>{$_("user_profile.street")}</td>
			<td>&nbsp;</td>
			<td>
				<CopyToClipboardField copy_value={user.street} />
			</td>
		</tr>
		<tr>
			<td>{$_("user_profile.zip")}</td>
			<td>&nbsp;</td>
			<td>
				<CopyToClipboardField copy_value={user.zip} />
			</td>
		</tr>
		<tr>
			<td>{$_("user_profile.city")}</td>
			<td>&nbsp;</td>
			<td>
				<CopyToClipboardField copy_value={user.city} />
			</td>
		</tr>
		<tr>
			<td>{$_("user_profile.email")}</td>
					<td>&nbsp;</td>
			<td
				><CopyToClipboardField copy_value={user.email} /></td
			>
		</tr>
		<tr>
			<td>{$_("user_profile.phone")}</td>
					<td>&nbsp;</td>
			<td
				><CopyToClipboardField copy_value={user.phone} /></td
			>
		</tr>
		<tr>
			<td>{$_("user_profile.inpost")}</td>
			<td>&nbsp;</td>
			<td>
				<CopyToClipboardField copy_value={user.inpost} />
			</td>
		</tr>
	</table>
</div>

<style>
	.input_copy {
		border: none;
		color: black;
		background: transparent;
		outline: none;
	}
</style>
