<script lang="ts">
	import { defineSubjectByIdQuery } from '$domains/subject/queries.js';
	import BaseEventCard from '$domains/events/components/event-card.svelte';
	import type { EventSeriesResponse } from '$domains/events';

	let { series }: { series: EventSeriesResponse } = $props();

	// Fetch subject details for the subject_id reactively using getters
	const subjectQuery = defineSubjectByIdQuery(
		{
			get id() {
				return series.subject_id ?? '';
			},
			expand: ''
		},
		{
			get enabled() {
				return !!series.subject_id;
			}
		}
	);

	const subjectName = $derived(
		subjectQuery.data?.name
			? (subjectQuery.data.name['id'] ?? Object.values(subjectQuery.data.name)[0] ?? '')
			: ''
	);
</script>

<BaseEventCard {series} {subjectName} hidePlaceLink={true} />
