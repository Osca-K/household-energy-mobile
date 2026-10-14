import type { PropsWithChildren } from 'react';
import type { StyleProp } from 'react-native';
// Light is the only approved appearance. Saved legacy Dark/Glass preferences
// cannot activate unfinished themes, including before storage hydration.
export function AppearanceProvider({ children }: PropsWithChildren) { return children; }
export function useAppearance() { return { dark: false, glass: false, reduced: true, background: '#f5f3ff', color: (value: string, _text = false) => value, style: <T,>(value: StyleProp<T>) => value }; }
