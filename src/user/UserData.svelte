<script lang="ts">
	import { _ } from "svelte-i18n";
	import type { UserProfile } from "../api/Api";
	import CopyToClipboardField from "../utils/CopyToClipboardField.svelte";
	import { RestApi } from "../api/rest_api";

	export let user: UserProfile;

	let notes: string = user.notes || "";
	let isSaving: boolean = false;
	let saveMessage: string = "";

	const api = new RestApi();

	// maybe change needed to more Svelte way ?
	function copyText(attr_id) {
		let copyText = document.getElementById(attr_id) as HTMLInputElement;
		copyText.select();
		copyText.setSelectionRange(0, 99999); // For mobile devices
		navigator.clipboard.writeText(copyText.value);
	}

	async function saveNotes() {
		isSaving = true;
		saveMessage = "";
		try {
			const updatedUser = await api.updateUserNotes(user.uuid, user.notes);
			if (updatedUser) {
				saveMessage = "✓ Zapisane";
				setTimeout(() => {
					saveMessage = "";
				}, 3000);
			}
		} catch (error) {
			saveMessage = "✗ Błąd zapisu";
		} finally {
			isSaving = false;
		}
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
			<td><CopyToClipboardField copy_value={user.email} /></td>
		</tr>
		<tr>
			<td>{$_("user_profile.phone")}</td>
			<td>&nbsp;</td>
			<td><CopyToClipboardField copy_value={user.phone} /></td>
		</tr>
		<tr>
			<td>{$_("user_profile.inpost")}</td>
			<td>&nbsp;</td>
			<td>
				<CopyToClipboardField copy_value={user.inpost} />
			</td>
		</tr>

		<tr>
			<td style="vertical-align: top; padding-top: 10px;">
				{$_("user_profile.notes")}
			</td>
			<td>&nbsp;</td>
			<td>
				<div class="notes-container">
					<textarea
						bind:value={user.notes}
						class="notes-textarea"
						rows="5"
						placeholder={$_("user_profile.notes")}
					/>
					<div class="notes-actions">
						<button
							on:click={saveNotes}
							disabled={isSaving}
							class="save-button"
						>
							{isSaving ? "..." : $_("user_profile.save_notes")}
						</button>
						{#if saveMessage}
							<span class="save-message">{saveMessage}</span>
						{/if}
					</div>
				</div>
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

	.notes-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.notes-textarea {
		width: 100%;
		min-width: 300px;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: inherit;
		font-size: 14px;
		resize: vertical;
	}

	.notes-textarea:focus {
		outline: none;
		border-color: #4a90e2;
	}

	.notes-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.save-button {
		padding: 8px 16px;
		background-color: #4a90e2;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	.save-button:hover:not(:disabled) {
		background-color: #357abd;
	}

	.save-button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.save-message {
		font-size: 14px;
		color: #28a745;
	}
</style>
