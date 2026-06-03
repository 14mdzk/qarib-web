/** Base style for the ghost pin shape (teardrop, v2 fidelity). */
export const ghostPinBaseStyle =
	'width: 18px; height: 22px; background: var(--color-ink-4); opacity: 0.4; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); animation: ghost-pulse 1.8s ease-in-out infinite;';

/**
 * Computes the full inline style for a ghost pin, appending the animation
 * delay when provided.
 */
export function ghostPinStyle(animationDelay = '0s'): string {
	return `${ghostPinBaseStyle} animation-delay: ${animationDelay};`;
}
