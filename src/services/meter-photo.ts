import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
export async function keepMeterPhoto(uri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') return ''; // Browser blob URLs are temporary; do not persist a broken preview.
  if (!FileSystem.documentDirectory) throw new Error('Photo storage is unavailable. Please try again.');
  const directory = FileSystem.documentDirectory + 'meter-readings/';
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = directory + id + '.jpg';
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}
