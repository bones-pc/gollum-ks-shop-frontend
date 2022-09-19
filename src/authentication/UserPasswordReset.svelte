<script lang="ts">
	import { get } from "svelte/store";
	import { _ } from "svelte-i18n";
	import { useNavigate } from "svelte-navigator";
	import { api } from "../api/Api";

	let password: string = "";
	let repeated_password: string = "";
	let warning = null;

	const navigate = useNavigate();

	export let a: string;
	export let b: string;
	export let c: string;
	const whitespaces = /^\s*$/;

	async function reset_pass() {
		warning = null;
		if (!validate_form()) {
			return;
		}
		let token = [a, b, c].join(".");
		let success = api.resetPassword(password, token);
		console.log(success);
		if (success) {
			navigate("/");
		} else {
			warning = get(_)("login.signup_error");
		}
	}

	function validate_form() {
		if (whitespaces.test(password)) {
			warning = get(_)("login.warn.password_must_not_be_empty");
			return false;
		}
		if (password !== repeated_password) {
			warning = get(_)("login.different_password");
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
				<label for="password1" class="form-label">
					{$_("login.password")}
				</label>
				<input
					bind:value={password}
					type="password"
					class="form-control"
					id="password1"
				/>
			</div>
			<div class="mb-3">
				<label for="password2" class="form-label">
					{$_("login.repeat_password")}
				</label>
				<input
					bind:value={repeated_password}
					type="password"
					class="form-control"
					id="password2"
				/>
			</div>
			<button type="button" on:click={reset_pass} class="btn btn-primary">
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
