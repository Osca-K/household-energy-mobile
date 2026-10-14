/* eslint-disable @typescript-eslint/no-redeclare -- Component value and native instance type share the React Native public API. */
import { forwardRef } from 'react';
import type * as Native from 'react-native';
import { View as NativeView, Text as NativeText, TextInput as NativeTextInput, Pressable as NativePressable, ScrollView as NativeScrollView } from 'react-native';
import { useAppearance } from './appearance';
// Keep React Native's lazy native-module getters unevaluated in Expo Go.
export { Animated, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform, StyleSheet, useWindowDimensions } from 'react-native';
export type { StyleProp, ViewStyle } from 'react-native';
export const View = forwardRef<NativeView, Native.ViewProps>((props, ref) => { const theme = useAppearance(); return <NativeView {...props} ref={ref} style={theme.style(props.style)} />; });
export const Text = forwardRef<NativeText, Native.TextProps>((props, ref) => { const theme = useAppearance(); return <NativeText {...props} ref={ref} style={theme.style(props.style)} />; });
export const TextInput = forwardRef<NativeTextInput, Native.TextInputProps>((props, ref) => { const theme = useAppearance(); return <NativeTextInput {...props} ref={ref} placeholderTextColor={theme.color(props.placeholderTextColor as string || '#8582a4', true)} style={theme.style(props.style)} />; });
export const Pressable = forwardRef<NativeView, Native.PressableProps>((props, ref) => { const theme = useAppearance(); const original = props.style; return <NativePressable {...props} ref={ref} style={typeof original === 'function' ? state => theme.style(original(state)) : theme.style(original)} />; });
export const ScrollView = forwardRef<NativeScrollView, Native.ScrollViewProps>((props, ref) => { const theme = useAppearance(); return <NativeScrollView {...props} ref={ref} style={theme.style(props.style)} contentContainerStyle={theme.style(props.contentContainerStyle)} />; });
View.displayName = 'ThemedView'; Text.displayName = 'ThemedText'; TextInput.displayName = 'ThemedTextInput'; Pressable.displayName = 'ThemedPressable'; ScrollView.displayName = 'ThemedScrollView';

export type View = Native.View; export type Text = Native.Text; export type TextInput = Native.TextInput; export type ScrollView = Native.ScrollView;
