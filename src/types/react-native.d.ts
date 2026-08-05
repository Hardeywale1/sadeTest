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
