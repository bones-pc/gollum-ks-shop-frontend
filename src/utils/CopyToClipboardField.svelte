<script lang="ts">
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";
	import { _ } from "svelte-i18n";
	export let copy_value: string = "";

	function copyText() {
		navigator.clipboard.writeText(copy_value);
	}
</script>

<input class="input_copy" id="copy_value_id" disabled value={copy_value} />
<button
	class="btn btn-light non-collapsing"
	type="button"
	data-bs-toggle="collapse"
	data-bs-target
	on:click={() => {
		copyText();
	}}
>
	<Fa icon={faCopy} primaryColor="blue" />
</button>

<style>
	.input_copy {
		border: none;
		color: black;
		background: transparent;
		outline: none;
	}
</style>
