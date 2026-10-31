import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { PlanKind, TodayItem } from "@/lib/api/types";
import { prettyTime } from "@/lib/format";
import { colors, fonts, radius } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { T } from "./ui";

export const KIND: Record<PlanKind, { label: string; icon: IconName; tone: string }> = {
  medication: { label: "Medicine", icon: "pill", tone: colors.lilac },
  care: { label: "Care task", icon: "care", tone: colors.coral },
  exercise: { label: "Exercise", icon: "walk", tone: colors.mint },
  appointment: { label: "Appointment", icon: "calendar", tone: colors.ember },
  milestone: { label: "Milestone", icon: "flag", tone: colors.ember },
};

/** One step of today's plan: tick it off, open it for what, why and how. */
export function StepCard({ item, index, onToggle, busy }: { item: TodayItem; index: number; onToggle: (done: boolean) => void; busy?: boolean }) {
  const [open, setOpen] = useState(false);
  const k = KIND[item.kind] ?? KIND.care;
  const toggleOpen = () => {
    if (Platform.OS !== "web") LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };
  const tick = () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(item.done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onToggle(!item.done);
  };
  const hasMore = Boolean(item.detail || item.why || item.how.length);
  return (
    <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: item.done ? "rgba(124,245,211,0.30)" : colors.line, backgroundColor: item.done ? "rgba(124,245,211,0.05)" : colors.glass, marginBottom: 10, overflow: "hidden" }} testID={`step-${index}`}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
        <Pressable onPress={tick} disabled={busy} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: item.done, disabled: busy }} aria-checked={item.done} accessibilityLabel={`${item.done ? "Done" : "Not done"}: ${item.title} at ${prettyTime(item.slot)}`} testID={`tick-${index}`} style={{ width: 34, height: 34, borderRadius: 11, borderWidth: 2, borderColor: item.done ? colors.mint : colors.haze + "77", backgroundColor: item.done ? colors.mint : "transparent", alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1 }}>
          {item.done ? <Icon name="check" size={20} color={colors.night} strokeWidth={2.6} /> : null}
        </Pressable>
        <Pressable onPress={hasMore ? toggleOpen : tick} style={{ flex: 1, minWidth: 0 }} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityHint={hasMore ? "Shows what, why and how" : undefined}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Icon name={k.icon} size={13} color={k.tone} />
            <T v="label" style={{ color: k.tone, fontSize: 10 }} numberOfLines={1}>
              {prettyTime(item.slot)} · {k.label}
            </T>
          </View>
          <T style={{ fontFamily: fonts.semibold, textDecorationLine: item.done ? "line-through" : "none", color: item.done ? colors.haze : colors.text }} numberOfLines={open ? undefined : 2}>
            {item.title}
          </T>
        </Pressable>
        {hasMore ? (
          <Pressable onPress={toggleOpen} hitSlop={10} accessibilityLabel={open ? "Hide details" : "Show details"} accessibilityRole="button" style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
            <Icon name="chevronDown" size={20} color={colors.haze} />
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 16, paddingLeft: 60, gap: 12 }}>
          {item.detail ? <Section label="What" body={item.detail} tone={colors.text} /> : null}
          {item.why ? <Section label="Why your team asked" body={item.why} tone={colors.ember} /> : null}
          {item.how.length ? (
            <View>
              <T v="label" style={{ color: colors.mint, marginBottom: 6 }}>
                How
              </T>
              {item.how.map((s, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                  <T v="mono" style={{ color: colors.mint, fontSize: 12, marginTop: 3 }}>
                    {i + 1}
                  </T>
                  <T v="small" style={{ flex: 1, color: colors.text }}>
                    {s}
                  </T>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Section({ label, body, tone }: { label: string; body: string; tone: string }) {
  return (
    <View>
      <T v="label" style={{ color: tone === colors.text ? colors.haze : tone, marginBottom: 4 }}>
        {label}
      </T>
      <T v="small" style={{ color: colors.text }}>
        {body}
      </T>
    </View>
  );
}
