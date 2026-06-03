/**
 * Overlay style for the ContentDim component.
 *
 * rgba(253,250,244,0.55) is --paper at 55% opacity. There is no pure Tailwind
 * token utility for this semi-transparent value — it is a documented exception
 * per the component comment.
 */
export const contentDimOverlayStyle =
	'position: absolute; inset: 0; background: rgba(253,250,244,0.55); pointer-events: none; border-radius: inherit;';
