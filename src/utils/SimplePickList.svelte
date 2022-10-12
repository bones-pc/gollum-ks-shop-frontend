<script>
	export let open = false;
	export let onClose;
	export let onSelected;
	export let showBackdrop = true;
	export let closeTitle = "close";
	export let selected_item = 0;
	export let list = [];

	const listClose = () => {
		open = false;
		if (onClose) {
			onClose();
		}
	};
	const onSelect = (item_idx) => {
		open = false;
		if (onSelected) {
			console.log(item_idx);
			onSelected(item_idx + 1);
		}
	};
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
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5>Wybierz Kampanię</h5>
				</div>
				<div class="modal-body">
					<ul>
						{#each list as item}
							<li
								id={item.idx}
								on:click={() => {
									onSelect(item.idx);
								}}
							>
								{item.title}
							</li>
						{/each}
					</ul>
				</div>
				<div class="modal-footer">
					<button
						type="button"
						class="btn btn-secondary"
						data-dismiss="modal"
						on:click={listClose}
					>
						{closeTitle}
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
	li {
		list-style-type: none;
	}
	li:hover {
		background-color: rgb(217, 217, 217);
	}
</style>
