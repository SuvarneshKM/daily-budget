import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderRadius: 15,
          height: 90,
          ...style.shadow,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Daily Budget",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 10,
              }}
            >
              <FontAwesome
                name="home"
                size={25}
                color={focused ? "#000" : "#748c94"}
              />
              <Text
                style={{ color: focused ? "#000" : "#748c94", fontSize: 12 }}
              >
                HOME
              </Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Daily Budget",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 10,
              }}
            >
              <FontAwesome
                name="line-chart"
                size={25}
                color={focused ? "#000" : "#748c94"}
              />
              <Text
                style={{ color: focused ? "#000" : "#748c94", fontSize: 12 }}
              >
                ANALYTICS
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const style = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});
