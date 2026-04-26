import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09111f',
          borderTopColor: '#182235',
          height: 74,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: '賽事中心',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: '社區棒球',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="abroad"
        options={{
          title: '旅外球員',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="abroad/[id]"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="league"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}