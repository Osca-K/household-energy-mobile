import type { ImageSource } from 'expo-image';
import { illustration } from './devices';

// Share the same transparent blue artwork across the list, picker, details and AI.
export const deviceListIllustration = (key: string): ImageSource => illustration(key);
