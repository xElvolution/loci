import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BricolageGrotesque_400Regular } from "@expo-google-fonts/bricolage-grotesque/400Regular";
import { BricolageGrotesque_500Medium } from "@expo-google-fonts/bricolage-grotesque/500Medium";
import { BricolageGrotesque_600SemiBold } from "@expo-google-fonts/bricolage-grotesque/600SemiBold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif/400Regular_Italic";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors, fonts } from "@/theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Routes() {
  const { ready, signedIn } = useAuth();
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night }, animation: "fade" }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="redeem" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="circle" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="plan" options={{ animation: "slide_from_right" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.regular]: BricolageGrotesque_400Regular,
    [fonts.medium]: BricolageGrotesque_500Medium,
    [fonts.semibold]: BricolageGrotesque_600SemiBold,
    [fonts.bold]: BricolageGrotesque_700Bold,
    [fonts.serifItalic]: InstrumentSerif_400Regular_Italic,
    [fonts.mono]: JetBrainsMono_400Regular,
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.night }}>
      <StatusBar style="light" />
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
