import { View } from "react-native";
import { BackHeader } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { KIND } from "@/components/StepCard";
import { Card, Disclaimer, ErrorBox, Row, Screen, Skeleton, T, Title } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { howSteps, prettyTime, relativeTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { colors, fonts } from "@/theme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PlanScreen() {
  const { api } = useAuth();
  const q = useApi(() => api.plan("current"));
  const p = q.data;
  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <BackHeader title="My plan" />
      <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="plan">
        <Title eyebrow="From your care team" title="Your plan," accent="in their words." />
        {q.loading && !p ? <Skeleton height={300} /> : null}
        {q.error && !p ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
        {p ? (
          <>
            {p.updated_at || p.sent_at ? (
              <T v="tiny" style={{ marginTop: -8, marginBottom: 12 }}>
                {p.updated_at ? `Updated ${relativeTime(p.updated_at)}` : `Sent ${relativeTime(p.sent_at as string)}`}
              </T>
            ) : null}
            {p.instructions ? (
              <Card tone="ember" style={{ marginBottom: 16 }}>
                <T v="label" style={{ color: colors.ember, marginBottom: 6 }}>
                  General instructions
                </T>
                <T style={{ fontSize: 15 }}>{p.instructions}</T>
              </Card>
            ) : null}
            {p.items.map((it) => {
              const k = KIND[it.kind] ?? KIND.care;
              const steps = howSteps(it.how);
              const when = it.kind === "appointment" || it.kind === "milestone" ? [it.day != null ? `Day ${it.day}` : null, it.at_time ? prettyTime(it.at_time) : null].filter(Boolean).join(", ") : [it.times.map(prettyTime).join(", "), it.weekdays?.length ? it.weekdays.map((d) => DAYS[d]).join(" ") : "Every day", it.end_day != null ? `until day ${it.end_day}` : null].filter(Boolean).join(" · ");
              return (
                <Card key={it.id} style={{ marginBottom: 12 }}>
                  <Row style={{ gap: 6 }}>
                    <Icon name={k.icon} size={14} color={k.tone} />
                    <T v="label" style={{ color: k.tone, flex: 1 }} numberOfLines={1}>
                      {k.label}
                      {when ? ` · ${when}` : ""}
                    </T>
                  </Row>
                  <T v="title" style={{ marginTop: 4 }}>
                    {it.title}
                  </T>
                  {it.detail ? (
                    <T v="small" style={{ marginTop: 6, color: colors.text }}>
                      {it.detail}
                    </T>
                  ) : null}
                  {it.why ? (
                    <View style={{ marginTop: 10 }}>
                      <T v="label" style={{ color: colors.ember }}>
                        Why your team asked
                      </T>
                      <T v="small" style={{ marginTop: 3, color: colors.text }}>
                        {it.why}
                      </T>
                    </View>
                  ) : null}
                  {steps.length ? (
                    <View style={{ marginTop: 10 }}>
                      <T v="label" style={{ color: colors.mint, marginBottom: 4 }}>
                        How
                      </T>
                      {steps.map((s, i) => (
                        <T key={i} v="small" style={{ color: colors.text, marginBottom: 2 }}>
                          <T v="mono" style={{ color: colors.mint, fontSize: 12 }}>
                            {i + 1}{" "}
                          </T>
                          {s}
                        </T>
                      ))}
                    </View>
                  ) : null}
                  {it.location ? (
                    <T v="tiny" style={{ marginTop: 8 }}>
                      {it.location}
                    </T>
                  ) : null}
                </Card>
              );
            })}
            {p.warning_signs.length ? (
              <Card tone="coral">
                <T v="title" style={{ marginBottom: 8 }}>
                  Warning signs
                </T>
                {p.warning_signs.map((s) => (
                  <Row key={s.id} style={{ alignItems: "flex-start", marginBottom: 6 }}>
                    <T v="label" style={{ color: s.action === "emergency" ? colors.coral : colors.ember, width: 76, marginTop: 3, fontFamily: fonts.mono }}>
                      {s.action === "emergency" ? "Emergency" : "Call team"}
                    </T>
                    <T v="small" style={{ flex: 1, color: colors.text }}>
                      {s.text}
                    </T>
                  </Row>
                ))}
              </Card>
            ) : null}
            <Disclaimer />
          </>
        ) : null}
      </Screen>
    </View>
  );
}
