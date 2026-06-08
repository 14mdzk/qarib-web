<script lang="ts">
	/**
	 * MapView — Leaflet client-only island.
	 *
	 * Server renders a sized placeholder div. The map initialises entirely in
	 * `onMount` so Leaflet (which calls `window`/`document`) never runs during
	 * SSR. Leaflet's CSS is also imported dynamically in `onMount`.
	 *
	 * Props:
	 *   - `center`        — [lat, lng] initial map centre.
	 *   - `zoom`          — initial zoom level (default 13).
	 *   - `pins`          — array of pins; each has id, lat, lng, tier, label,
	 *                       and optional selected flag.
	 *   - `userLocation`  — [lat, lng] of the device; renders a distinct dot.
	 *   - `onpinclick`    — callback fired with the pin id when a pin is clicked.
	 *   - `clusters`      — optional array of {lat, lng, count} for cluster markers.
	 *                       // TODO(B-followup): wire real clustering (leaflet.markercluster is a dep decision)
	 *
	 * Tile layer: `/api/tiles/{z}/{x}/{y}{r}.png` (BFF proxy; ADR 0013).
	 * Attribution control is rendered (required by Stadia free tier).
	 * Respects `prefers-reduced-motion` (disables zoom/pan animation and
	 * the user-location pulsing ring via the app.css ghost-pulse keyframe).
	 *
	 * Conformance:
	 *   - .claude/rules/styling.md  (client-only island; token colours; no fetch)
	 *   - .claude/rules/security.md (STADIA_API_KEY stays server-side — never here)
	 *   - ADR 0013 (tile proxy)
	 */
	import { onMount, onDestroy } from 'svelte';
	import { m } from '$core/i18n';
	import type { PinTier } from '$domains/events/pin-tier.js';
	import { buildPinIconHtml } from './pin-icon.js';
	import { Minus, Plus } from '@lucide/svelte';

	interface Pin {
		id: string | number;
		lat: number;
		lng: number;
		tier: PinTier;
		label?: string;
		selected?: boolean;
	}

	interface Cluster {
		lat: number;
		lng: number;
		count: number;
	}

	interface Props {
		center: [number, number];
		zoom?: number;
		pins?: Pin[];
		userLocation?: [number, number];
		clusters?: Cluster[];
		onpinclick?: (id: string | number) => void;
	}

	let { center, zoom = 13, pins = [], userLocation, clusters, onpinclick }: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	const pinSignature = $derived(
		pins
			.map((pin) =>
				[pin.id, pin.lat, pin.lng, pin.tier, pin.label ?? '', pin.selected ? '1' : '0'].join(':')
			)
			.join('|')
	);
	const clusterSignature = $derived(
		(clusters ?? []).map((cluster) => [cluster.lat, cluster.lng, cluster.count].join(':')).join('|')
	);

	// Internal Leaflet map instance — module-level via closure, not $state,
	// because Leaflet objects are not plain-serialisable values.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet runtime types are loose; re-typing its internals isn't worth it
	let L: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet Map; typed via `L` above, not a separate import
	let map: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet LayerGroup; typed via `L` above
	let pinLayerGroup: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet LayerGroup for clusters; typed via `L` above
	let clusterLayerGroup: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet Marker; nullable, typed via `L` above
	let userMarker: any;

	// Check prefers-reduced-motion once at mount; memoised in a boolean.
	let reducedMotion = false;

	function buildPinIcon(pin: Pin): unknown {
		const html = buildPinIconHtml({
			tier: pin.tier,
			label: pin.label ?? '',
			selected: pin.selected
		});
		// Pill: 38px min-width × 30px body height + 7px tail = 37px total height.
		// Anchor at bottom-center so the tail tip touches the coordinate.
		return L.divIcon({
			className: '',
			html,
			iconSize: [38, 37],
			iconAnchor: [19, 37],
			popupAnchor: [0, -40]
		});
	}

	/**
	 * v2 `.my-loc-dot`: 16px blue circle, 3px white border, pulsing ring.
	 * The pulsing ring uses the ghost-pulse keyframe from app.css.
	 * When reducedMotion is true, the ring animation is omitted.
	 */
	function buildUserLocationIcon(): unknown {
		const ringStyle = reducedMotion
			? [
					'position:absolute',
					'inset:-8px',
					'border-radius:50%',
					'background:rgba(58,111,168,0.2)'
				].join(';')
			: [
					'position:absolute',
					'inset:-8px',
					'border-radius:50%',
					'background:rgba(58,111,168,0.2)',
					'animation:ghost-pulse 2.2s ease-in-out infinite'
				].join(';');

		const html = `<div style="${[
			'position:relative',
			'width:16px',
			'height:16px',
			'border-radius:50%',
			'background:var(--color-blue)',
			'border:3px solid white',
			'box-shadow:0 2px 6px rgba(58,111,168,0.5)'
		].join(';')}"><div style="${ringStyle}"></div></div>`;

		return L.divIcon({
			className: '',
			html,
			iconSize: [16, 16],
			iconAnchor: [8, 8]
		});
	}

	/**
	 * v2 `.map-cluster`: 40px white circle, 2px orange border, orange-700 count.
	 * // TODO(B-followup): wire real clustering (leaflet.markercluster is a dep decision)
	 */
	function buildClusterIcon(count: number): unknown {
		const html = `<div style="${[
			'width:40px',
			'height:40px',
			'border-radius:50%',
			'background:white',
			'border:2px solid var(--color-orange)',
			'color:var(--color-orange-700)',
			'display:grid',
			'place-items:center',
			'font-size:13px',
			'font-weight:800',
			'font-family:inherit',
			'box-shadow:0 3px 8px rgba(26,21,16,0.2)'
		].join(';')}">${count}</div>`;

		return L.divIcon({
			className: '',
			html,
			iconSize: [40, 40],
			iconAnchor: [20, 20]
		});
	}

	function renderPins(currentPins: Pin[]): void {
		if (!pinLayerGroup) return;
		pinLayerGroup.clearLayers();
		for (const pin of currentPins) {
			const marker = L.marker([pin.lat, pin.lng], { icon: buildPinIcon(pin) });
			marker.on('click', () => {
				onpinclick?.(pin.id);
			});
			pinLayerGroup.addLayer(marker);
		}
	}

	function renderClusters(currentClusters: Cluster[] | undefined): void {
		if (!clusterLayerGroup) return;
		clusterLayerGroup.clearLayers();
		if (!currentClusters) return;
		for (const cluster of currentClusters) {
			const marker = L.marker([cluster.lat, cluster.lng], {
				icon: buildClusterIcon(cluster.count)
			});
			clusterLayerGroup.addLayer(marker);
		}
	}

	function renderUserLocation(loc: [number, number] | undefined): void {
		if (!map) return;
		if (userMarker) {
			userMarker.remove();
			userMarker = null;
		}
		if (loc) {
			userMarker = L.marker(loc, { icon: buildUserLocationIcon(), zIndexOffset: 1000 }).addTo(map);
		}
	}

	function zoomIn(): void {
		map?.zoomIn();
	}

	function zoomOut(): void {
		map?.zoomOut();
	}

	onMount(async () => {
		// Dynamic import so Leaflet + CSS never run during SSR.
		const leafletModule = await import('leaflet');
		L = leafletModule.default;

		// Leaflet CSS — also deferred to avoid SSR issues.
		await import('leaflet/dist/leaflet.css');

		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!mapContainer) return;

		map = L.map(mapContainer, {
			center,
			zoom,
			zoomControl: false,
			zoomAnimation: !reducedMotion,
			markerZoomAnimation: !reducedMotion,
			fadeAnimation: !reducedMotion
		});

		L.tileLayer('/api/tiles/{z}/{x}/{y}{r}.png', {
			detectRetina: true,
			attribution:
				'&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> ' +
				'&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
				'&copy; <a href="https://www.openstreetmap.org/about" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
			maxZoom: 20
		}).addTo(map);

		pinLayerGroup = L.layerGroup().addTo(map);
		clusterLayerGroup = L.layerGroup().addTo(map);

		renderPins(pins);
		renderClusters(clusters);
		renderUserLocation(userLocation);
	});

	// Reactively re-render pins when the prop changes.
	$effect(() => {
		const trackedPins = pinSignature === '' ? [] : pins;
		if (map && pinLayerGroup) {
			renderPins(trackedPins);
		}
	});

	// Reactively re-render clusters when the prop changes.
	$effect(() => {
		const trackedClusters = clusterSignature === '' ? [] : clusters;
		if (map && clusterLayerGroup) {
			renderClusters(trackedClusters);
		}
	});

	// Reactively update the user-location marker.
	$effect(() => {
		if (map) {
			renderUserLocation(userLocation);
		}
	});

	// Reactively fly to the new center when the prop changes (post-mount only).
	$effect(() => {
		if (map) {
			if (reducedMotion) {
				map.setView(center, zoom);
			} else {
				map.setView(center, zoom, { animate: true });
			}
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = undefined;
		}
	});
</script>

<!--
  Server renders a same-sized placeholder div.
  The map element is a fixed-height block; callers set height via a class or
  style on the parent.  The div itself carries `role="application"` so screen
  readers know it is interactive.
-->
<div
	bind:this={mapContainer}
	role="application"
	aria-label={m.map_view_aria_label()}
	class="h-full w-full"
></div>

<div class="map-zoom-controls" role="toolbar" aria-label={m.map_view_aria_label()}>
	<button type="button" onclick={zoomIn} aria-label={m.map_zoom_in_label()}>
		<Plus class="size-5" aria-hidden="true" />
	</button>
	<button type="button" onclick={zoomOut} aria-label={m.map_zoom_out_label()}>
		<Minus class="size-5" aria-hidden="true" />
	</button>
</div>

<style>
	.map-zoom-controls {
		position: absolute;
		right: 14px;
		bottom: calc(var(--map-fab-bottom, 20px) + 52px);
		z-index: 998;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.map-zoom-controls button {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--color-paper);
		border: 1px solid var(--color-line);
		box-shadow: 0 4px 12px rgba(26, 21, 16, 0.15);
		display: grid;
		place-items: center;
		color: var(--color-ink);
		cursor: pointer;
	}

	.map-zoom-controls button:hover {
		box-shadow: 0 6px 16px rgba(26, 21, 16, 0.2);
	}

	.map-zoom-controls button:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}
</style>
