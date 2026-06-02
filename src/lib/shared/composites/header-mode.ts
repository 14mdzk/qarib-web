export type HeaderMode = 'home' | 'back';

const HOME_PATHS = new Set(['/', '/peta']);

export function resolveHeaderMode(pathname: string): HeaderMode {
	return HOME_PATHS.has(pathname) ? 'home' : 'back';
}
