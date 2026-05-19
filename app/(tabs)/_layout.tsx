import { Tabs } from 'expo-router';
import { Image, StyleSheet, Text } from 'react-native';
import { CN_FONT } from '../../constants/fonts';

const tabBarBg = require('../../assets/home/bottom_tab_ticket.png');

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarIconStyle: {
          display: 'none',
          width: 0,
          height: 0,
          margin: 0,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 66,
          paddingTop: 0,
          paddingBottom: 8,
          shadowColor: '#0B2346',
          shadowOpacity: 0.16,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -3 },
          elevation: 10,
          position: 'absolute',
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <Image source={tabBarBg} style={styles.tabBarBg} resizeMode="stretch" />
        ),
        tabBarItemStyle: {
          paddingTop: 16,
          paddingBottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: '#0B2346',
        tabBarInactiveTintColor: '#0B2346',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarLabel: ({ color }) => <Text style={[styles.tabLabel, { color }]}>首頁</Text>,
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: '賽事中心',
          tabBarLabel: ({ color }) => <Text style={[styles.tabLabel, { color }]}>賽事中心</Text>,
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: '社區棒球',
          tabBarLabel: ({ color }) => <Text style={[styles.tabLabel, { color }]}>社區棒球</Text>,
        }}
      />

      <Tabs.Screen
        name="abroad"
        options={{
          title: '旅外球員',
          tabBarLabel: ({ color }) => <Text style={[styles.tabLabel, { color }]}>旅外球員</Text>,
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

const styles = StyleSheet.create({
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  tabLabel: {
    fontFamily: CN_FONT,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginLeft: 8,
    color: '#0B2346',
  },
});
