import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from "@/theme";

const ROAD = "M10 120 C 70 120, 80 40, 150 52 S 250 120, 330 34";

/** Decorative road home for the welcome screen; draws itself once. */
export function RoadArt() {
  const [a] = useState(() => new Animated.Value(0));
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = a.addListener(({ value }) => setT(value));
    Animated.timing(a, { toValue: 1, duration: 1600, delay: 300, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [a]);
  const L = 420;
  return (
    <View style={{ marginVertical: 18 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height={150} viewBox="0 0 340 150" preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="road" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.lilac} />
            <Stop offset="0.5" stopColor={colors.coral} />
            <Stop offset="1" stopColor={colors.ember} />
          </LinearGradient>
        </Defs>
        <Path d={ROAD} stroke="rgba(255,255,255,0.07)" strokeWidth={18} fill="none" strokeLinecap="round" />
        <Path d={ROAD} stroke="url(#road)" strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${L * t} ${L}`} />
        {[
          [10, 120, 0.05],
          [150, 52, 0.45],
          [250, 92, 0.72],
          [330, 34, 0.98],
        ].map(([x, y, at], k) => (
          <Circle key={k} cx={x} cy={y} r={t >= at ? (k === 3 ? 9 : 6) : 0} fill={k === 3 ? colors.ember : colors.night} stroke={k === 3 ? colors.coral : colors.ember} strokeWidth={3} />
        ))}
      </Svg>
    </View>
  );
}

/** The road home for the journey screen: vertical, one stop per milestone. */
export function JourneyRoad({ stops, progress }: { stops: { key: string; label: string; sub: string; reached: boolean }[]; progress: number }) {
  return (
    <View style={{ paddingLeft: 6 }}>
      {stops.map((s, i) => {
        const last = i === stops.length - 1;
        return (
          <View key={s.key} style={{ flexDirection: "row", gap: 14, minHeight: 64 }}>
            <View style={{ width: 22, alignItems: "center" }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, marginTop: 2, borderWidth: 3, borderColor: s.reached ? colors.mint : last ? colors.ember : colors.haze + "88", backgroundColor: s.reached ? colors.mint : colors.night }} />
              {!last ? <View style={{ flex: 1, width: 3, marginVertical: 4, borderRadius: 2, backgroundColor: s.reached ? colors.mint + "AA" : "rgba(255,255,255,0.12)" }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 16 }}>
              <Animated.Text style={{ fontFamily: "Bricolage-SemiBold", fontSize: 16, color: s.reached ? colors.text : colors.haze }}>{s.label}</Animated.Text>
              <Animated.Text style={{ fontFamily: "JetBrains-Regular", fontSize: 12, color: s.reached ? colors.mint : colors.haze, marginTop: 2 }}>{s.sub}</Animated.Text>
            </View>
          </View>
        );
      })}
      <View accessibilityLabel={`${Math.round(progress * 100)} percent of the way`} />
    </View>
  );
}
