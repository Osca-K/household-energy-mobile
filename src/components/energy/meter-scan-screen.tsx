import { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Platform, Pressable, Text, TextInput, View } from '@/design/themed-native';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { useHousehold } from '@/state/household';
import { meterCandidates, meterTime, meterUnit, parseMeterValue, readingLabel, type MeterKind } from '@/data/meter-readings';
import { recognizeLabel, scanningAvailable } from '@/services/label-recognition';
import { keepMeterPhoto } from '@/services/meter-photo';
import { Card, Page, OutlineIcon } from './primitives';
import { ScreenHeader } from './device-controls';
import { SegmentedControl } from './segmented-control';

export default function MeterScanScreen() {
  const { state, update, ready } = useHousehold();
  const [kind, setKind] = useState<MeterKind>('total'); const [value, setValue] = useState('');
  const [photo, setPhoto] = useState(''); const [scannedAt, setScannedAt] = useState(''); const [text, setText] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [showText, setShowText] = useState(false);
  const lock = useRef(false); const captured = useRef('');
  const candidates = meterCandidates(text, kind);
  const pick = async (camera: boolean) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      if (camera) { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) { setError('Allow camera access, or choose a photo instead.'); return; } }
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled) return;
      const uri = result.assets[0].uri; const time = new Date().toISOString();
      captured.current = time; setValue(''); setPhoto(uri); setScannedAt(time); setText(''); setSaved(false);
      if (scanningAvailable) { try { setText(await recognizeLabel(uri)); } catch { setError('The display could not be read. Enter the visible value below or retake the photo.'); } }
    } catch { setError('Could not open the photo. Try again or choose another image.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const save = async () => {
    if (!ready || lock.current || saved) return;
    const number = parseMeterValue(value);
    if (!photo || !scannedAt) { setError('Take or choose a meter photo first.'); return; }
    if (number === null) { setError('Enter a reading of zero or more, using up to four decimal places.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const id = 'meter-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
      const photoUri = await keepMeterPhoto(photo, id);
      const reading = { id, kind, value: number, unit: meterUnit(kind), photoUri, scannedAt: captured.current, confirmedAt: new Date().toISOString(), recognisedText: text || undefined };
      update(current => ({ ...current, meterReadings: [reading, ...(current.meterReadings || [])] })); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the reading. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Page keyboard><ScreenHeader title="Scan meter" subtitle="Capture and confirm your meter reading" />
    <Card><View style={{ gap: 14 }}><View style={[s.row, { gap: 12 }]}><View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: palette.blueSurface, alignItems: 'center', justifyContent: 'center' }}><OutlineIcon name="scan" size={25} /></View><View style={{ flex: 1 }}><Text style={s.heading}>Capture the display</Text><Text style={[s.secondary, { marginTop: 5 }]}>Keep the digits sharp and avoid glare.</Text></View></View>{!!photo && <Image source={{ uri: photo }} contentFit="contain" alt="Meter photo for review" style={{ width: '100%', height: 220, borderRadius: 18 }} />}<Action label={busy ? 'Working…' : photo ? 'Retake photo' : 'Take photo'} disabled={busy} onPress={() => void pick(true)} primary /><Action label="Choose from photos" disabled={busy} onPress={() => void pick(false)} />{!scanningAvailable && <Text style={s.secondary}>Check the photo and enter its reading below.</Text>}</View></Card>
    {!!photo && <Card><View style={{ gap: 12 }}><Text style={s.heading}>Confirm reading</Text><SegmentedControl label="Meter reading type" value={kind} options={[{ value: 'total', label: 'Total kWh' }, { value: 'remaining', label: 'Units left' }, { value: 'credit', label: 'Credit (R)' }]} onChange={next => { setKind(next); setSaved(false); }} /><Text style={s.secondary}>{readingLabel[kind]} ({meterUnit(kind)})</Text><TextInput accessibilityLabel="Meter reading value" editable={!busy} keyboardType="decimal-pad" value={value} onChangeText={next => { setValue(next); setSaved(false); }} placeholder="Enter the value shown" style={{ minHeight: 50, borderWidth: 1, borderColor: palette.divider, borderRadius: 14, paddingHorizontal: 14, fontSize: 18, color: palette.navy }} />{candidates.length > 0 && <><Text style={s.secondary}>Read from photo — tap a value to use it</Text>{candidates.map(candidate => <Action key={candidate} label={candidate + ' ' + meterUnit(kind)} disabled={busy} onPress={() => { setValue(candidate); setSaved(false); }} />)}</>}<Text style={s.secondary}>Scan time: {meterTime(scannedAt)} SAST</Text><Text style={s.secondary}>This is when the photo was added, not its original capture date.</Text>{!!text && <><Action label={showText ? 'Hide scanned text' : 'View scanned text'} onPress={() => setShowText(!showText)} />{showText && <Text selectable style={s.secondary}>{text}</Text>}</>}{Platform.OS === 'web' && <Text style={s.secondary}>The reading and time are saved. Photo storage is available in the mobile app.</Text>}<Action label={saved ? 'Reading saved' : 'Confirm and save reading'} primary disabled={busy || saved || !ready} onPress={() => void save()} />{saved && <Text accessibilityRole="alert" style={{ color: palette.blue, fontSize: 13 }}>Reading confirmed and saved.</Text>}</View></Card>}
    {!!error && <Card><Text accessibilityRole="alert" style={{ color: '#b85670', fontSize: 13 }}>{error}</Text></Card>}
    <Card><Text style={s.heading}>Reading history</Text>{!(state.meterReadings || []).length ? <Text style={[s.secondary, { marginTop: 12 }]}>Your confirmed readings will appear here.</Text> : [...(state.meterReadings || [])].sort((a, b) => b.scannedAt.localeCompare(a.scannedAt)).map(reading => <View key={reading.id} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.divider, gap: 5 }}>{!!reading.photoUri && <Image source={{ uri: reading.photoUri }} contentFit="contain" alt="Saved meter photo" style={{ height: 110, width: '100%', borderRadius: 12 }} />}<Text style={s.body}>{readingLabel[reading.kind]}: {reading.value} {reading.unit}</Text><Text style={s.secondary}>Scanned {meterTime(reading.scannedAt)} SAST</Text><Text style={s.secondary}>Confirmed {meterTime(reading.confirmedAt)} SAST</Text></View>)}</Card>
  </Page>;
}
function Action({ label, primary = false, disabled = false, onPress }: { label: string; primary?: boolean; disabled?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={{ minHeight: 46, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? palette.blue : palette.blueSurface, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: primary ? 'white' : palette.blue, fontSize: 13, fontWeight: '500' }}>{label}</Text></Pressable>; }
