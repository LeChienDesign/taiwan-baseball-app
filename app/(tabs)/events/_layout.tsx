import { Stack } from 'expo-router';

export default function EventsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pro" />
      <Stack.Screen name="international" />
      <Stack.Screen name="asia" />
    </Stack>
  );
}