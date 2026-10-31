import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { T } from "./ui";
import { Wordmark } from "./Wordmark";

function HeadBtn({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} testID={testID} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)" })}>
      <Icon name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

/** Tab header: wordmark, then care circle and settings. */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 18, paddingBottom: 8, backgroundColor: colors.night, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
      <Wordmark width={84} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <HeadBtn icon="users" label="Care circle" onPress={() => router.push("/circle")} testID="open-circle" />
        <HeadBtn icon="settings" label="Settings" onPress={() => router.push("/settings")} testID="open-settings" />
      </View>
    </View>
  );
}

/** Stack header with a back button and a title. */
export function BackHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, backgroundColor: colors.night, flexDirection: "row", alignItems: "center", gap: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
      <HeadBtn icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} testID="back" />
      <T v="title" numberOfLines={1} style={{ flex: 1 }}>
        {title}
      </T>
    </View>
  );
}
