import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#07111F',
          borderTopColor: '#0B2346',
          borderTopWidth: 2,
          height: 78,
          paddingTop: 7,
          paddingBottom: 10,
          shadowColor: '#0B2346',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -3 },
          elevation: 10,
        },
        tabBarActiveTintColor: '#F0642B',
        tabBarInactiveTintColor: '#F7D9B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '900',
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size + 1} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: '賽事中心',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size + 1} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: '社區棒球',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size + 1} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="abroad"
        options={{
          title: '旅外球員',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane" size={size + 1} color={color} />
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
