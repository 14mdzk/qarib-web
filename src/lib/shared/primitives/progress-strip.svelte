<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { m } from '$core/i18n';
	import { progressStripTrackStyle, progressStripThumbStyle } from './progress-strip-variants.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
	}

	let { class: klass = '', ...rest }: Props = $props();
</script>

<!--
  Thin orange progress strip shown during background refresh.
  @keyframes stripe defined in app.css; reduced-motion rule in app.css neutralises it.
-->
<div
	role="progressbar"
	aria-valuemin={0}
	aria-valuemax={100}
	aria-label={m.loading_progress_label()}
	class={cn('relative overflow-hidden', klass)}
	style={progressStripTrackStyle}
	{...rest}
>
	<span aria-hidden="true" style={progressStripThumbStyle}></span>
</div>
