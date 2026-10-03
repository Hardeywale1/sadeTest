import * as Location from 'expo-location';

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
  accuracy_meters: number;
};

export async function getDeviceCoordinates(): Promise<DeviceCoordinates> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission was not granted.');
  }
  const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: result.coords.latitude,
    longitude: result.coords.longitude,
    accuracy_meters: Math.max(0, result.coords.accuracy || 0),
  };
}
