declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const TextInput: any;
  export const TouchableOpacity: any;
  export const StyleSheet: any;
  export const ScrollView: any;
  export const SafeAreaView: any;
  export const Modal: any;
  export const ActivityIndicator: any;
  export const RefreshControl: any;
  export const StatusBar: any;
  export const KeyboardAvoidingView: any;
  export const Alert: any;
  export const Platform: { OS: 'ios' | 'android' | 'web'; select: (obj: any) => any };
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  export default AsyncStorage;
}

// `@types/react-dom` is not installed; only createPortal is used, to lift toasts
// above react-native-web's body-level Modal container on the web build.
declare module 'react-dom' {
  const ReactDOM: {
    createPortal: (children: any, container: any, key?: string) => any;
  };
  export default ReactDOM;
}
