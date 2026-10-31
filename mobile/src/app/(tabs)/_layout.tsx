import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "@/components/Header";
import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts } from "@/theme";

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color }: { color: unknown }) => <Icon name={icon} size={23} color={typeof color === "string" ? color : colors.haze} />,
  tabBarButtonTestID: `tab-${title.toLowerCase().replace(/\s+/g, "-")}`,
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        sceneStyle: { backgroundColor: colors.night },
        tabBarActiveTintColor: colors.ember,
        tabBarInactiveTintColor: colors.haze,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.dusk950,
          borderTopColor: "rgba(255,255,255,0.08)",
          height: 62 + Math.max(insets.bottom, Platform.OS === "web" ? 6 : 8),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen name="index" options={tab("Today", "today")} />
      <Tabs.Screen name="checkin" options={tab("Check in", "heart")} />
      <Tabs.Screen name="journey" options={tab("Journey", "road")} />
      <Tabs.Screen name="comfort" options={tab("Comfort", "spark")} />
      <Tabs.Screen name="ask" options={tab("Ask", "chat")} />
    </Tabs>
  );
}
