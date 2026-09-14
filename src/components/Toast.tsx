import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReactDOM from 'react-dom';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export type ToastTone = 'info' | 'success' | 'error';

type ToastMessage = { id: number; title: string; body?: string; tone: ToastTone };

let publish: ((title: string, body: string | undefined, tone: ToastTone) => void) | null = null;
let nextId = 1;

/**
 * Cross-platform replacement for React Native's Alert.
 *
 * react-native-web ships Alert as an empty stub (`class Alert { static alert() {} }`),
 * so on the web build every Alert.alert call did nothing at all — validation messages
 * and failed requests were invisible, which made working buttons look broken.
 * These messages go through an in-app banner instead, which renders on web and native.
 */
export const toast = (title: string, body?: string, tone: ToastTone = 'info') => {
  if (publish) {
    publish(title, body, tone);
    return;
  }
  // Before the host mounts there is nowhere to draw; keep the message somewhere visible.
  console.warn(`[toast] ${title}${body ? `: ${body}` : ''}`);
};

const TONE_STYLE: Record<ToastTone, { background: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  info: { background: COLORS.primary, icon: 'information-outline' },
  success: { background: COLORS.emerald, icon: 'check-circle-outline' },
  error: { background: '#93000A', icon: 'alert-circle-outline' },
};

/**
 * Mounts once near the root of the app and renders any message sent to `toast()`.
 */
export const ToastHost: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  useEffect(() => {
    publish = (title, body, tone) => {
      const id = nextId++;
      setMessages((current) => [...current.slice(-2), { id, title, body, tone }]);
      timers.current[id] = setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
    };
    return () => {
      publish = null;
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    };
  }, [dismiss]);

  const stack = messages.length ? (
    <View style={styles.stack} pointerEvents="box-none">
      {messages.map((message) => (
        <TouchableOpacity
          key={message.id}
          activeOpacity={0.9}
          style={[styles.toast, { backgroundColor: TONE_STYLE[message.tone].background }]}
          onPress={() => dismiss(message.id)}
          accessibilityRole="alert"
        >
          <MaterialCommunityIcons name={TONE_STYLE[message.tone].icon} size={20} color="#FFFFFF" />
          <View style={styles.copy}>
            <Text style={styles.title}>{message.title}</Text>
            {message.body ? <Text style={styles.body}>{message.body}</Text> : null}
          </View>
          <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      ))}
    </View>
  ) : null;

  return (
    <View style={styles.host}>
      {children}
      {/*
        react-native-web mounts each Modal into its own `position: fixed;
        z-index: 9999` div appended to document.body — a sibling of #root. A
        toast rendered inside #root therefore cannot paint above an open modal
        at any z-index, so on web it is portalled to document.body too and
        given a higher z-index. Screens still prefer inline errors inside a
        modal; this keeps cross-cutting toasts visible when one is open.
      */}
      {Platform.OS === 'web' && typeof document !== 'undefined' && stack
        ? ReactDOM.createPortal(stack, document.body)
        : stack}
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  stack: {
    // `fixed` on web because the stack is portalled to document.body, where an
    // absolute offset would resolve against the page rather than the viewport.
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    // Above react-native-web's Modal container, which sits at 9999.
    zIndex: 10000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
