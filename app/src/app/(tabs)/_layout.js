import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { useApp } from '../../lib/AppContext';

export default function TabsLayout() {
  const { queue } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '700' },
        tabBarStyle: { height: 72, paddingTop: 6, paddingBottom: 10, borderTopColor: colors.border },
        tabBarItemStyle: { minHeight: 56 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarAccessibilityLabel: 'Início: problemas perto de você',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="relatar"
        options={{
          title: 'Relatar',
          tabBarAccessibilityLabel: 'Relatar um problema',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meus"
        options={{
          title: 'Meus relatos',
          tabBarAccessibilityLabel: 'Meus relatos e andamento',
          tabBarBadge: queue.length ? queue.length : undefined,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'list' : 'list-outline'} size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
