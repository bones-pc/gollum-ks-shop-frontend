<script lang="ts">
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";
	import { _ } from "svelte-i18n";

	export let legend_list = [];
	export let headline = "";
	export let toast_shown = false;

	export let onShow = () => {
		let toast = document.querySelector("#test");
		toast.show();
	};
</script>

{console.log(toast_shown)}
{#if toast_shown == true}
	{onShow()}
	<div
		class="toast"
		id="test"
		role="alert"
		aria-live="assertive"
		aria-atomic="true"
	>
		<div class="toast-header">
			<img src="..." class="rounded me-2" alt="..." />
			<strong class="me-auto">Bootstrap</strong>
			<small>11 mins ago</small>
			<button
				type="button"
				class="btn-close"
				data-bs-dismiss="toast"
				aria-label="Close"
			/>
		</div>
		<div class="toast-body">Hello, world! This is a toast message.</div>
	</div>
{/if}
