/**
 * Style constant for the Skeleton shimmer element.
 *
 * v2 warm shimmer: linear-gradient over paper-2/paper-3, animated with
 * @keyframes shimmer defined in app.css. Reduced-motion rule in app.css
 * neutralises the animation.
 */
export const skeletonStyle =
	'background: linear-gradient(90deg, var(--color-paper-2) 0%, var(--color-paper-3) 50%, var(--color-paper-2) 100%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; border-radius: 6px;';
