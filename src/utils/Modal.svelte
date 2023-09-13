<script>
	export let open = false;
	export let showBackdrop = true;
	export let onClosed;
	export let onClick;
	export let small = false;
	export let title = "...";
	export let action = "delete";
	export let close = "close";
	let modal_class = "modal-dialog ";
	if (small) modal_class += " modal-sm";

	const modalClose = () => {
		open = false;
		if (onClosed) {
			onClosed();
		}
	};

	const modalAction = () => {
		open = false;
		if (onClick) {
			onClick();
		}
	};
	console.log(modal_class);
</script>

{#if open}
	<div
		class="modal"
		id="sampleModal"
		tabindex="-1"
		role="dialog"
		aria-labelledby="sampleModalLabel"
		aria-hidden={false}
	>
		<div class={modal_class} role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="sampleModalLabel">{title}</h5>
					{#if !small}
						<button
							type="button"
							class="close"
							data-dismiss="modal"
							aria-label="Close"
							on:click={modalClose}
						>
							<span aria-hidden="true">&times;</span>
						</button>
					{/if}
				</div>
				<div class="modal-body"><slot /></div>
				<div class="modal-footer">
					{#if !small}
						<button
							type="button"
							class="btn btn-secondary"
							data-dismiss="modal"
							on:click={modalClose}
						>
							{close}
						</button>
					{/if}
					<button type="button" on:click={modalAction} class="btn btn-primary">
						{action}
					</button>
				</div>
			</div>
		</div>
	</div>
	{#if showBackdrop}
		<div class="modal-backdrop show" />
	{/if}
{/if}

<style>
	.modal {
		display: block;
	}
</style>
