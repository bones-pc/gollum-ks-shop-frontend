<script lang="ts">
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import Fa from "svelte-fa";
	import { _ } from "svelte-i18n";

	export let sort_by_list = [];
	export let headline = "";
	export let selected = 0;
	export let onChangeHandler = () => {};
</script>

<div>
	{headline}
	<select class="select" bind:value={selected} on:change={onChangeHandler}>
		{#each sort_by_list as item, option}
			<option value={option}>{item}</option>
		{/each}
	</select>
</div>
