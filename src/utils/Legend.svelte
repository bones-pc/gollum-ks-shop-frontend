<script lang="ts">
	import { faCopy } from "@fortawesome/free-regular-svg-icons";
	import SimpleToast from "./SimpleToast.svelte";
	import Fa from "svelte-fa";
	import { _ } from "svelte-i18n";

	export let legend_body = "test";
	export let legend_id = "simple_legend";
</script>

<SimpleToast toast_id={legend_id}>
	<div slot="toast-body" class="">
		<div class="row">
			<div>
				<span class="badge bg-success">
					{$_("proposed_campaigns.confirmed")}</span
				>
				<div class="small">Będzie... mam warunki</div>
			</div>
			<div class="row">
				<div>
					<span class="badge bg-warning"
						>{$_("proposed_campaigns.negotiations")}</span
					>.<br />

					<div class="small">Negocjacje z wydawcą</div>
				</div>
			</div>
			<div class="row">
				<div>
					<span class="badge bg-success">
						{$_("proposed_campaigns.denied")}></span
					>
					<div class="small">
						Nie dogadałem się. Taniej kupisz w polskim skliepie
					</div>
				</div>
			</div>
		</div>
	</div></SimpleToast
>
