import { LinearGradient as Original, type LinearGradientProps } from 'expo-linear-gradient';
import { useAppearance } from './appearance';
export function LinearGradient(props: LinearGradientProps) { const theme = useAppearance(); return <Original {...props} style={theme.style(props.style)} colors={props.colors.map(value => typeof value === 'string' ? theme.color(value) : value) as unknown as LinearGradientProps['colors']} />; }
