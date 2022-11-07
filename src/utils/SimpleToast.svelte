<script lang="ts">
	export let toast_body = "";
	export let toast_id = "simple_toast";
</script>

<div
	class="position-fixed bottom-0 end-0 p-3 toast align-items-center"
	role="alert"
	aria-live="assertive"
	aria-atomic="true"
	id={toast_id}
	style="z-index: 11"
>
	<div class="d-flex">
		<div class="toast-body">
			<slot name="toast-body" />
		</div>
		<button
			type="button"
			class="btn-close me-2 m-auto"
			data-bs-dismiss="toast"
			aria-label="Close"
		/>
	</div>
</div>
