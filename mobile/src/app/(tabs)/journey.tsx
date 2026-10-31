import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { JourneyRoad } from "@/components/Road";
import { Card, Disclaimer, ErrorBox, Pill, Row, Screen, Skeleton, T, Title } from "@/components/ui";
import type { Metric, TrendPoint } from "@/lib/api/types";
import { roadStops } from "@/lib/journey";
import { useAuth } from "@/lib/auth";
import { prettyDate, prettyTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { colors, fonts } from "@/theme";

const METRICS: { key: Metric; label: string; min: number; max: number; color: string; better: "up" | "down" }[] = [
  { key: "mood", label: "Mood", min: 1, max: 5, color: colors.ember, better: "up" },
  { key: "pain", label: "Pain", min: 0, max: 10, color: colors.coral, better: "down" },
  { key: "sleep", label: "Sleep", min: 1, max: 5, color: colors.lilac, better: "up" },
  { key: "appetite", label: "Appetite", min: 1, max: 5, color: colors.mint, better: "up" },
  { key: "energy", label: "Energy", min: 1, max: 5, color: "#8AD4FF", better: "up" },
];

export default function Journey() {
  const { api } = useAuth();
  const q = useApi(() => api.journey("current"));
  const j = q.data;
  const reached = j ? j.milestones.filter((m) => m.reached).length : 0;
  const progress = j ? Math.max(0, Math.min(1, j.day / Math.max(1, j.horizon_days))) : 0;
  return (
    <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="journey">
      <Title eyebrow="Your journey" title="The road" accent="home." />
      {q.loading && !j ? <Skeleton height={320} /> : null}
      {q.error && !j ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
      {j ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View>
                <T v="label">Day</T>
                <T style={{ fontFamily: fonts.bold, fontSize: 34 }}>
                  {Math.max(0, j.day)}
                  <T v="small"> of {j.horizon_days}</T>
                </T>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Pill text={`${j.streak} day streak`} tone="ember" icon="flame" />
                <Pill text={j.adherence_7d == null ? "No plan data yet" : `${Math.round(j.adherence_7d * 100)}% of plan, 7 days`} tone="mint" icon="check" />
              </View>
            </Row>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 14, overflow: "hidden" }} accessibilityLabel={`${Math.round(progress * 100)} percent of the way`}>
              <View style={{ width: `${progress * 100}%`, height: 8, borderRadius: 4, backgroundColor: colors.ember }} />
            </View>
            <T v="tiny" style={{ marginTop: 6 }}>
              {reached} of {j.milestones.length} milestones reached
            </T>
          </Card>

          <T v="h2" style={{ marginBottom: 12 }}>
            Milestones
          </T>
          <Card style={{ marginBottom: 16 }}>
            <JourneyRoad stops={roadStops(j)} progress={progress} />
          </Card>

          {j.appointments.length ? (
            <>
              <T v="h2" style={{ marginBottom: 12 }}>
                Appointments
              </T>
              <Card style={{ marginBottom: 16, gap: 12 }}>
                {j.appointments.map((a, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ width: 52, alignItems: "center", paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(255,193,94,0.12)" }}>
                      <T v="mono" style={{ color: colors.ember, fontSize: 11 }}>
                        {prettyDate(a.date).split(" ").slice(0, 1).join("") || "TBC"}
                      </T>
                      <T style={{ fontFamily: fonts.bold }}>{a.date ? Number(a.date.slice(8, 10)) : "?"}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: fonts.semibold }}>{a.title}</T>
                      <T v="tiny">{[a.time ? prettyTime(a.time) : null, a.location].filter(Boolean).join(" · ") || prettyDate(a.date)}</T>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <T v="h2" style={{ marginBottom: 4 }}>
            Last 30 days
          </T>
          <T v="tiny" style={{ marginBottom: 12 }}>
            From your daily check-ins. Gaps are days without one.
          </T>
          <Card style={{ gap: 14 }}>
            {METRICS.map((m) => (
              <Trend key={m.key} m={m} points={j.trends} />
            ))}
          </Card>
          <Disclaimer />
        </>
      ) : null}
    </Screen>
  );
}

function Trend({ m, points }: { m: (typeof METRICS)[number]; points: TrendPoint[] }) {
  const vals = points.map((p) => p[m.key]);
  const last = [...vals].reverse().find((v) => v != null);
  const w = 200;
  const h = 34;
  const n = Math.max(1, vals.length - 1);
  const segs: string[][] = [[]];
  vals.forEach((v, i) => {
    if (v == null) segs.push([]);
    else segs[segs.length - 1].push(`${((i / n) * w).toFixed(1)},${(h - 3 - ((v - m.min) / (m.max - m.min)) * (h - 6)).toFixed(1)}`);
  });
  return (
    <Row>
      <View style={{ width: 78 }}>
        <T v="small" style={{ color: colors.text, fontFamily: fonts.semibold }}>
          {m.label}
        </T>
        <T v="tiny">{last == null ? "No data" : `Latest ${last}/${m.max}`}</T>
      </View>
      <View style={{ flex: 1, height: h }} accessibilityLabel={`${m.label} trend`}>
        <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {segs
            .filter((s) => s.length)
            .map((s, k) => (
              <Polyline key={k} points={s.length === 1 ? `${s[0]} ${s[0]}` : s.join(" ")} fill="none" stroke={m.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            ))}
        </Svg>
      </View>
    </Row>
  );
}
