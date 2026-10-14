import type { ComponentProps } from 'react';
import Svg, * as Native from 'react-native-svg';
import { useAppearance } from './appearance';
export * from 'react-native-svg';
function usePaint<T extends { fill?: unknown; stroke?: unknown }>(props: T): T { const theme = useAppearance(); return { ...props, fill: typeof props.fill === 'string' ? theme.color(props.fill) : props.fill, stroke: typeof props.stroke === 'string' ? theme.color(props.stroke) : props.stroke }; }
export default function ThemedSvg(props: ComponentProps<typeof Svg>) { return <Svg {...usePaint(props)} />; }
export function Text(props: ComponentProps<typeof Native.Text>) { return <Native.Text {...usePaint(props)} />; }
export function Path(props: ComponentProps<typeof Native.Path>) { return <Native.Path {...usePaint(props)} />; }
export function Circle(props: ComponentProps<typeof Native.Circle>) { return <Native.Circle {...usePaint(props)} />; }
export function Line(props: ComponentProps<typeof Native.Line>) { return <Native.Line {...usePaint(props)} />; }
export function Rect(props: ComponentProps<typeof Native.Rect>) { return <Native.Rect {...usePaint(props)} />; }
