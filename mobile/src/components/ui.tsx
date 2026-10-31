import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, RadialGradient, Stop } from "react-native-svg";
import { colors, fonts, radius } from "@/theme";
import { telHref } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

type Variant = "body" | "small" | "tiny" | "title" | "h1" | "h2" | "label" | "mono" | "serif";
const V: Record<Variant, TextStyle> = {
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.haze },
  tiny: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.haze },
  title: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  h1: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 36, color: colors.text, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 27, color: colors.text, letterSpacing: -0.3 },
  label: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, color: colors.haze, letterSpacing: 1.4, textTransform: "uppercase" },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.text },
  serif: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ember },
};

export function T({ v = "body", style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[V[v], style]} />;
}

/** Headline with the Instrument Serif italic accent, like the web PageTitle. */
export function Title({ eyebrow, title, accent, size = 30 }: { eyebrow?: string; title: string; accent?: string; size?: number }) {
  return (
    <View style={{ marginBottom: 16 }}>
      {eyebrow ? (
        <T v="label" style={{ color: colors.ember, marginBottom: 6 }}>
          {eyebrow}
        </T>
      ) : null}
      <T v="h1" style={{ fontSize: size, lineHeight: size * 1.12 }} accessibilityRole="header">
        {title}
        {accent ? (
          <T v="serif" style={{ fontSize: size * 1.02, lineHeight: size * 1.12, color: colors.ember }}>
            {" "}
            {accent}
          </T>
        ) : null}
      </T>
    </View>
  );
}

export function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[colors.dusk800, colors.dusk950, colors.night]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Glow color={colors.violet} opacity={0.32} size={520} style={{ top: -240, right: -220 }} />
      <Glow color={colors.coral} opacity={0.14} size={520} style={{ top: 220, left: -300 }} />
    </View>
  );
}

/** A soft radial glow (no hard edge), drawn with an SVG radial gradient. */
export function Glow({ color, size, opacity = 0.3, style }: { color: string; size: number; opacity?: number; style?: StyleProp<ViewStyle> }) {
  const id = `glow${color.replace("#", "")}`;
  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Scrolling screen with the dusk backdrop, safe-area padding and pull to refresh. */
export function Screen({ children, onRefresh, refreshing = false, header = true, padBottom = 32, testID }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean; header?: boolean; padBottom?: number; testID?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.night }} testID={testID}>
      <Backdrop />
      <ScrollView
        contentContainerStyle={{ paddingTop: header ? 8 : insets.top + 16, paddingHorizontal: 18, paddingBottom: padBottom + (header ? 0 : insets.bottom) }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ember} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({ children, style, tone = "glass" }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: "glass" | "coral" | "mint" | "ember" | "plain" }) {
  const t = {
    glass: { backgroundColor: colors.glass, borderColor: colors.line },
    plain: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.line },
    coral: { backgroundColor: "rgba(255,107,90,0.10)", borderColor: "rgba(255,107,90,0.45)" },
    mint: { backgroundColor: "rgba(124,245,211,0.07)", borderColor: "rgba(124,245,211,0.32)" },
    ember: { backgroundColor: "rgba(255,193,94,0.08)", borderColor: "rgba(255,193,94,0.35)" },
  }[tone];
  return <View style={[styles.card, t, style]}>{children}</View>;
}

type BtnProps = { label: string; onPress?: () => void; icon?: IconName; disabled?: boolean; busy?: boolean; testID?: string; style?: StyleProp<ViewStyle>; accessibilityLabel?: string };

export function Button({ label, onPress, icon, disabled, busy, testID, style, accessibilityLabel }: BtnProps) {
  const off = disabled || busy;
  return (
    <Pressable onPress={onPress} disabled={off} testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: off, busy }} style={({ pressed }) => [{ opacity: off ? 0.5 : pressed ? 0.88 : 1, borderRadius: radius.pill }, style]}>
      <LinearGradient colors={[colors.ember, colors.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {busy ? <ActivityIndicator color={colors.night} /> : icon ? <Icon name={icon} size={18} color={colors.night} /> : null}
        <Text style={[styles.btnText, { color: colors.night }]} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon, disabled, busy, testID, style, tone = "default", accessibilityLabel }: BtnProps & { tone?: "default" | "danger" | "light" }) {
  const off = disabled || busy;
  const fg = tone === "danger" ? colors.coral : tone === "light" ? colors.night : colors.text;
  const bg = tone === "light" ? colors.soft : "transparent";
  const border = tone === "danger" ? "rgba(255,107,90,0.5)" : tone === "light" ? colors.soft : colors.lineStrong;
  return (
    <Pressable onPress={onPress} disabled={off} testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: off, busy }} style={({ pressed }) => [styles.btn, { backgroundColor: bg, borderWidth: 1, borderColor: border, opacity: off ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...rest }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <T v="small" style={{ color: colors.text, fontFamily: fonts.semibold, marginBottom: 6 }}>
        {label}
      </T>
      <TextInput placeholderTextColor="rgba(185,176,230,0.55)" accessibilityLabel={label} {...rest} style={[styles.input, rest.multiline ? { minHeight: 96, paddingTop: 12, textAlignVertical: "top" } : null, rest.style]} />
      {hint ? (
        <T v="tiny" style={{ marginTop: 4 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function Pill({ text, tone = "haze", icon }: { text: string; tone?: "haze" | "ember" | "coral" | "mint" | "lilac"; icon?: IconName }) {
  const c = { haze: colors.haze, ember: colors.ember, coral: colors.coral, mint: colors.mint, lilac: colors.lilac }[tone];
  return (
    <View style={[styles.pill, { borderColor: c + "66", backgroundColor: c + "1A" }]}>
      {icon ? <Icon name={icon} size={13} color={c} /> : null}
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: c }}>{text}</Text>
    </View>
  );
}

export function Skeleton({ height = 120, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const [a] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 0.85, duration: 700, useNativeDriver: Platform.OS !== "web" }), Animated.timing(a, { toValue: 0.4, duration: 700, useNativeDriver: Platform.OS !== "web" })]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View accessibilityLabel="Loading" style={[{ height, borderRadius: radius.lg, backgroundColor: colors.dusk800, opacity: a, marginBottom: 14 }, style]} />;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card tone="coral" style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Icon name="alert" size={18} color={colors.coral} />
        <T style={{ flex: 1, color: "#F8E3DE" }} accessibilityRole="alert">
          {message}
        </T>
      </View>
      {onRetry ? <GhostButton label="Try again" onPress={onRetry} style={{ marginTop: 12, alignSelf: "flex-start" }} /> : null}
    </Card>
  );
}

export function CallButtons({ phone, team, emergency, testID }: { phone?: string | null; team?: string | null; emergency?: string | null; testID?: string }) {
  const em = emergency || "112";
  return (
    <View style={{ gap: 10, marginTop: 14 }} testID={testID}>
      {phone ? (
        <Pressable onPress={() => void Linking.openURL(telHref(phone))} accessibilityRole="link" accessibilityLabel={`Call ${team || "your care team"} on ${phone}`} style={({ pressed }) => [styles.callBtn, { backgroundColor: colors.soft, opacity: pressed ? 0.85 : 1 }]} testID="call-team">
          <Icon name="phone" size={20} color={colors.night} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.callText, { color: colors.night }]} numberOfLines={1}>
              Call {team ? team.split(",")[0] : "your care team"}
            </Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.dusk700 }}>{phone}</Text>
          </View>
        </Pressable>
      ) : null}
      <Pressable onPress={() => void Linking.openURL(telHref(em))} accessibilityRole="link" accessibilityLabel={`Call emergency ${em}`} style={({ pressed }) => [styles.callBtn, { backgroundColor: colors.coral, opacity: pressed ? 0.85 : 1 }]} testID="call-emergency">
        <Icon name="alert" size={20} color={colors.night} />
        <Text style={[styles.callText, { color: colors.night, flex: 1 }]}>Emergency {em}</Text>
      </Pressable>
    </View>
  );
}

export function ProgressRing({ value, size = 92, stroke = 9, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.mint} />
            <Stop offset="0.6" stopColor={colors.ember} />
            <Stop offset="1" stopColor={colors.coral} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        {v > 0 ? <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-g)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>{children}</View>
    </View>
  );
}

export function Disclaimer() {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 18, alignItems: "flex-start" }}>
      <Icon name="shield" size={15} color={colors.mint} />
      <T v="tiny" style={{ flex: 1 }}>
        loci shows the plan your care team gave you and never gives medical advice or a diagnosis. If you are worried, contact your care team. In an emergency, call your local emergency number.
      </T>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 18 },
  btn: { minHeight: 52, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20 },
  btnText: { fontFamily: fonts.semibold, fontSize: 16 },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(185,176,230,0.25)", backgroundColor: "rgba(11,10,31,0.6)", color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingHorizontal: 14 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  callBtn: { minHeight: 56, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  callText: { fontFamily: fonts.bold, fontSize: 16 },
});
