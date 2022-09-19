<script lang="ts">
	import { get } from "svelte/store";
	import { _ } from "svelte-i18n";
	import { useNavigate } from "svelte-navigator";
	import { api } from "../api/Api";

	let email: string = "";
	let warning = null;
	const navigate = useNavigate();
	const whitespaces = /^\s*$/;

	async function init_reset_pass() {
		warning = null;
		if (!validate_form()) {
			return;
		}
		let success = api.initPasswordReset(email);
		if (success) {
			let successful_signup = true;
		} else {
			warning = get(_)("login.signup_error");
		}
	}

	function validate_form() {
		if (whitespaces.test(email)) {
			warning = get(_)("login.warn.email_must_not_be_empty");
			return false;
		}
		return true;
	}
</script>

<h1>{$_("login.password_reset")}</h1>
<div class="centered mt-4">
	<div class="stacked">
		<form>
			<div class="mb-3">
				<label for="email" class="form-label">{$_("login.email")}</label>
				<input
					bind:value={email}
					type="email"
					class="form-control"
					id="email"
				/>
			</div>
			<button type="button" on:click={init_reset_pass} class="btn btn-primary">
				{$_("login.reset")}
			</button>
			{#if warning != null}
				<div class="alert alert-warning mt-4" role="alert">
					{warning}
				</div>
			{/if}
		</form>
	</div>
</div>

<style>
	form {
		max-width: 300px;
	}

	.centered {
		display: flex;
		justify-content: center;
	}

	.stacked {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
</style>
