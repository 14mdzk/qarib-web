import type { components } from '$generated/upstream';

export function l10n(
	map: components['schemas']['L10nString'] | null | undefined,
	preferredLang?: 'id' | 'en'
): string {
	if (!map) return '';
	switch (preferredLang) {
		case 'id':
			return map['id'] ?? Object.values(map)[0] ?? '';
		case 'en':
			return map['en'] ?? Object.values(map)[0] ?? '';
		default:
			return map['id'] ?? Object.values(map)[0] ?? '';
	}
}
