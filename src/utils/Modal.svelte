<script>
  export let open = false;
  export let showBackdrop = true;
  export let onClosed;
  export let onClick;

  export let title = "...";
  export let action = "delete";
  export let close = "close";

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
</script>

{#if open}
  <div
    class="modal"
    id="sampleModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="sampleModalLabel"
    aria-hidden={false}>
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="sampleModalLabel">{title}</h5>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
            on:click={modalClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-dismiss="modal"
            on:click={modalClose}>
            {close}
          </button>
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
