<script lang="ts">
</script>

<div class="container d-none d-md-block">
	<!-- <div class="img" /> -->
	<slot name="title" />
</div>

<style>
	.img {
		width: 90px;
		height: 59px;
		object-fit: cover;
		overflow: hidden;
		float: left;
		font-size: 1rem;
		line-height: 26px;
		text-align: center;
	}

	.accordion-button {
		width: none !important;
		flex: 1;
	}

	.accordion-button:focus {
		box-shadow: none !important;
	}
</style>
