import { useEffect, useId, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { colors } from "@/theme";

type Props = { width?: number; color?: string; animated?: boolean };

const R = 17.5;
const C = 2 * Math.PI * R;
const native = Platform.OS !== "web";
const ease = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * The loci wordmark, ported from webapp/src/components/brand/Wordmark.tsx:
 * lowercase "loci", the "o" is a route ring with four stops that draws itself,
 * and the dot of the "i" is a map pin that drops in. Tap it to replay.
 */
export function Wordmark({ width = 120, color = colors.text, animated = true }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const height = (width * 76) / 176;
  const [reduce, setReduce] = useState(false);
  const [draw] = useState(() => new Animated.Value(animated ? 0 : 1));
  const [pin] = useState(() => new Animated.Value(animated ? 0 : 1));
  const [t, setT] = useState(animated ? 0 : 1);

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => live && setReduce(r))
      .catch(() => undefined);
    const sub = draw.addListener(({ value }) => setT(value));
    return () => {
      live = false;
      draw.removeListener(sub);
    };
  }, [draw]);

  const play = () => {
    if (!animated || reduce) {
      draw.setValue(1);
      pin.setValue(1);
      return;
    }
    draw.setValue(0);
    pin.setValue(0);
    Animated.parallel([
      Animated.timing(draw, { toValue: 1, duration: 1800, delay: 200, easing: ease, useNativeDriver: false }),
      Animated.sequence([Animated.delay(1100), Animated.spring(pin, { toValue: 1, stiffness: 260, damping: 14, mass: 1, useNativeDriver: native })]),
    ]).start();
  };

  useEffect(() => {
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, animated]);

  const ring = Math.min(1, t / 0.78);
  const pinY = pin.interpolate({ inputRange: [0, 1], outputRange: [(-14 * height) / 76, 0] });

  return (
    <Pressable onPress={play} accessibilityRole="image" accessibilityLabel="loci" hitSlop={8} testID="wordmark">
      <View style={{ width, height }}>
        <Svg width={width} height={height} viewBox="0 0 176 76">
          <Defs>
            <LinearGradient id={`ring${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFC15E" />
              <Stop offset="0.55" stopColor="#FF6B5A" />
              <Stop offset="1" stopColor="#B48CFF" />
            </LinearGradient>
          </Defs>
          <G fill="none" stroke={color} strokeWidth={11} strokeLinecap="round">
            <Path d="M12 8 V62" />
            <Path d="M121.5 34.5 A17.5 17.5 0 1 0 121.5 59.5" />
            <Path d="M150 37 V62" />
          </G>
          <Circle cx={53} cy={47} r={R} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={11} />
          {ring > 0.001 && (
            <Circle
              cx={53}
              cy={47}
              r={R}
              fill="none"
              stroke={`url(#ring${id})`}
              strokeWidth={11}
              strokeLinecap="round"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={C * (1 - ring)}
              transform="rotate(-90 53 47)"
            />
          )}
          {[0, 90, 180, 270].map((deg, k) => {
            const a = ((deg - 90) * Math.PI) / 180;
            const s = Math.max(0, Math.min(1, (t - 0.28 - k * 0.12) / 0.12));
            return <Circle key={deg} cx={53 + Math.cos(a) * R} cy={47 + Math.sin(a) * R} r={2.4 * s} fill={colors.night} />;
          })}
        </Svg>
        <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width, height, opacity: pin, transform: [{ translateY: pinY }] }}>
          <Svg width={width} height={height} viewBox="0 0 176 76">
            <Defs>
              <RadialGradient id={`pin${id}`} cx="0.4" cy="0.35" r="0.7">
                <Stop offset="0" stopColor="#FFE3A3" />
                <Stop offset="1" stopColor="#FF6B5A" />
              </RadialGradient>
            </Defs>
            <Path d="M150 26 C143 18.5 139.5 14 139.5 9.5 A10.5 10.5 0 0 1 160.5 9.5 C160.5 14 157 18.5 150 26 Z" fill={`url(#pin${id})`} />
            <Circle cx={150} cy={9.6} r={3.6} fill={colors.night} />
          </Svg>
        </Animated.View>
      </View>
    </Pressable>
  );
}
