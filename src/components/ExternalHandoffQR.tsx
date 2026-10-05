import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import QRCode from 'qrcode';
import { ui } from './CareUI';

declare const process: { env: { EXPO_PUBLIC_APP_URL?: string } };

export const ExternalHandoffQR = ({ kind, token }: { kind: 'laboratory' | 'pharmacy'; token: string }) => {
  const [image, setImage] = useState('');
  const url = useMemo(() => {
    const configured = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');
    const base = configured || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '');
    if (!base) return '';
    const parameter = kind === 'laboratory' ? 'handoff' : 'pharmacy_handoff';
    return `${base}?${parameter}=${encodeURIComponent(token)}`;
  }, [kind, token]);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 260, margin: 1, color: { dark: '#681227', light: '#FFFFFF' } }).then(setImage).catch(() => setImage(''));
  }, [url]);

  return <View style={[ui.card, { alignItems: 'center' }]}>
    <Text style={ui.heading}>{kind === 'laboratory' ? 'Laboratory request QR' : 'Pharmacy prescription QR'}</Text>
    <Text style={[ui.text, { textAlign: 'center' }]}>Ask the {kind} to scan this code on their own device. They will enter their organisation details after scanning.</Text>
    {image ? <Image source={{ uri: image }} style={{ width: 220, height: 220 }} /> : <Text style={ui.small}>QR code is unavailable. Configure EXPO_PUBLIC_APP_URL for this build.</Text>}
  </View>;
};
