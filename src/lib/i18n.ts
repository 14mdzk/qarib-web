import id from '../messages/id.json';

// i18n-ready message pattern. One locale today (id); a second locale ships
// by adding its JSON here and extending the Locale union — no call-site churn.
export type Locale = 'id';

const catalogs = { id } as const;

export type Messages = (typeof catalogs)[Locale];

export function getMessages(locale: Locale = 'id'): Messages {
	return catalogs[locale];
}
