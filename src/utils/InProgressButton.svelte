<script>
	export let on_click_function = async () => {};
	export let disabled_predicate = () => false;
	export let label;
	export let in_progress = false;
	export let btn_class = "btn-primary";

	async function click() {
		in_progress = true;
		await on_click_function();
		in_progress = false;
	}
</script>

<button
	type="button"
	class="btn {btn_class}"
	on:click={click}
	disabled={disabled_predicate() || in_progress}
>
	{#if in_progress}
		<span
			class="spinner-border spinner-border-sm"
			role="status"
			aria-hidden="true"
		/>
	{/if}
	{label}
</button>
