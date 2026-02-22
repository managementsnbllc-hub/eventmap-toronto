import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import NotifPrefsScreen from '../screens/NotifPrefsScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LocationPicker from '../components/LocationPicker';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Explore: focused ? 'map' : 'map-outline',
            Saved: focused ? 'bookmark' : 'bookmark-outline',
            Alerts: focused ? 'notifications' : 'notifications-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: FONT.sizes.xs,
          ...FONT.medium,
        },
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
        },
      })}
    >
      <Tab.Screen name="Explore" component={HomeScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={HomeTabs} />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="NotifPrefs"
        component={NotifPrefsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="LocationPicker"
        component={LocationPicker}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
