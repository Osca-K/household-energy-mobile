import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
type Recognizer = { recognizeText(uri: string): Promise<string> };
export const nativeLabelRecognizer = Platform.OS === 'web' ? null : requireOptionalNativeModule<Recognizer>('ApplianceLabelOcr');
export const scanningAvailable = !!nativeLabelRecognizer;
export async function recognizeLabel(uri: string): Promise<string> {
  if (!nativeLabelRecognizer) throw new Error('Label scanning requires a development build. You can enter specifications manually.');
  const text = await nativeLabelRecognizer.recognizeText(uri);
  if (!text.trim()) throw new Error('No readable text found. Try a clearer photo or enter specifications manually.');
  return text;
}
