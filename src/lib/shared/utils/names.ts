/**
 * Strip honorary prefixes ("Ustadz ", "Ustadzah ", "Ust. ") from a raw name
 * string before deriving initials, so an alias like "Ustadz Subhan Bawazier"
 * yields "SB" rather than "US".
 */
const HONORARY_PREFIX_RE = /^(ustadz(ah)?\.?|ust\.?)\s+/i;

/**
 * Derive two-letter initials from a display name.
 *
 * - Strips honorary prefixes before processing.
 * - Single-word names → first two chars.
 * - Multi-word names → first char of first word + first char of last word.
 */
export function deriveInitials(raw: string): string {
	if (!raw) return '?';
	const stripped = raw.replace(HONORARY_PREFIX_RE, '').trim();
	const parts = stripped.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return raw.charAt(0).toUpperCase();
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
