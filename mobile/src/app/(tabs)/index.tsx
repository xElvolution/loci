import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Icon } from "@/components/Icon";
import { StepCard } from "@/components/StepCard";
import { Button, CallButtons, Card, Disclaimer, Glow, ErrorBox, GhostButton, Pill, ProgressRing, Row, Screen, Skeleton, T } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { firstName, greeting, prettyDate, prettyTime, relativeTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { colors, fonts } from "@/theme";

export default function Today() {
  const { api, user } = useAuth();
  const { joined } = useLocalSearchParams<{ joined?: string }>();
  const q = useApi(() => api.today("current"));
  const [pending, setPending] = useState<string | null>(null);
  const [tickError, setTickError] = useState<string | null>(null);
  const t = q.data;

  if (q.error?.code === "no_journey") return <NoJourney />;

  const toggle = async (itemId: string, slot: string, done: boolean) => {
    const key = `${itemId}|${slot}`;
    setPending(key);
    setTickError(null);
    q.setData((d) => (d ? { ...d, items: d.items.map((i) => (i.item_id === itemId && i.slot === slot ? { ...i, done } : i)), progress: { ...d.progress, done: d.progress.done + (done ? 1 : -1) } } : d));
    try {
      const r = await api.tick("current", itemId, slot, done);
      q.setData((d) => (d ? { ...d, progress: r.progress } : d));
    } catch (e) {
      setTickError((e as Error).message);
      void q.reload();
    } finally {
      setPending(null);
    }
  };

  const hour = new Date().getHours();
  const pct = t && t.progress.total ? t.progress.done / t.progress.total : 0;
  const isSelf = t ? firstName(t.person_name).toLowerCase() === firstName(user?.display_name).toLowerCase() : true;

  return (
    <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="today">
      {q.loading && !t ? (
        <>
          <Skeleton height={190} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </>
      ) : null}
      {q.error && !t ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
      {t ? (
        <>
          {joined === "1" ? (
            <Card tone="mint" style={{ marginBottom: 14 }}>
              <Row>
                <Icon name="spark" color={colors.mint} />
                <T v="title" style={{ flex: 1 }}>
                  Your plan from {t.contact.care_team_name || "your care team"} is here
                </T>
              </Row>
              <T v="small" style={{ marginTop: 6 }}>
                Today shows what is due. Open a step for what, why and how. Check in once a day, and use Ask for questions.
              </T>
            </Card>
          ) : null}
          {t.plan_update ? (
            <Card tone="ember" style={{ marginBottom: 14 }}>
              <Row style={{ alignItems: "flex-start" }}>
                <Icon name="bell" color={colors.ember} />
                <View style={{ flex: 1 }}>
                  <T v="title">Your care team updated your plan</T>
                  <T v="small" style={{ marginTop: 4, color: colors.text }}>
                    {t.plan_update.text}
                  </T>
                  <T v="tiny" style={{ marginTop: 4 }}>
                    {relativeTime(t.plan_update.at)}
                  </T>
                </View>
              </Row>
              <GhostButton
                label="Got it"
                icon="check"
                style={{ marginTop: 12, alignSelf: "flex-start", minHeight: 44 }}
                testID="plan-seen"
                onPress={() => {
                  q.setData((d) => (d ? { ...d, plan_update: null } : d));
                  void api.planSeen("current").catch(() => undefined);
                }}
              />
            </Card>
          ) : null}

          <View style={{ borderRadius: 30, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.dusk900, padding: 20, marginBottom: 16, overflow: "hidden" }}>
            <Glow color={colors.coral} size={300} opacity={0.3} style={{ top: -150, right: -130 }} />
            <T v="label" style={{ color: colors.ember }} numberOfLines={1}>
              {t.specialty_label} · {t.day < 0 ? `home in ${-t.day} days` : `day ${t.day}`}
            </T>
            <T v="h1" style={{ marginTop: 8 }} accessibilityRole="header">
              {greeting(hour)},{"\n"}
              <T v="serif" style={{ fontSize: 34, lineHeight: 38 }}>
                {firstName(user?.display_name)}.
              </T>
            </T>
            <T v="small" style={{ marginTop: 6 }}>
              {isSelf ? "Here is your day, straight from your plan." : `Here is ${t.person_name}'s day, straight from the plan.`}
            </T>
            <Row style={{ marginTop: 18, gap: 16 }}>
              <ProgressRing value={pct}>
                <T style={{ fontFamily: fonts.bold, fontSize: 22 }}>
                  {t.progress.done}/{t.progress.total}
                </T>
                <T v="tiny" style={{ fontSize: 10 }}>
                  done today
                </T>
              </ProgressRing>
              <View style={{ flex: 1, gap: 10 }}>
                <Row style={{ gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,193,94,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="flame" size={17} color={colors.ember} />
                  </View>
                  <T style={{ flex: 1 }}>
                    <T style={{ fontFamily: fonts.bold }}>{t.streak}</T> day check-in streak
                  </T>
                </Row>
                <Row style={{ gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(180,140,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="calendar" size={17} color={colors.lilac} />
                  </View>
                  <T style={{ flex: 1 }} numberOfLines={2}>
                    {t.next_appointment ? `${t.next_appointment.title}, ${prettyDate(t.next_appointment.date)}${t.next_appointment.time ? ` ${prettyTime(t.next_appointment.time)}` : ""}` : "No appointment in the plan yet"}
                  </T>
                </Row>
              </View>
            </Row>
          </View>

          {t.open_flags > 0 ? (
            <Card tone="coral" style={{ marginBottom: 16 }}>
              <Row style={{ alignItems: "flex-start" }}>
                <Icon name="alert" color={colors.coral} />
                <T v="title" style={{ flex: 1, color: colors.coral }} accessibilityRole="alert">
                  Today&apos;s check-in matched something your care team asked to hear about
                </T>
              </Row>
              <CallButtons phone={t.contact.care_team_phone} team={t.contact.care_team_name} emergency={t.contact.emergency_number} />
            </Card>
          ) : null}

          {!t.checkin_done ? (
            <Pressable onPress={() => router.push("/checkin")} accessibilityRole="button" testID="checkin-cta" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: 18 })}>
              <Card tone="plain" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,107,90,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="heart" color={colors.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: fonts.semibold }}>Daily check-in</T>
                  <T v="tiny">Two minutes: mood, pain, sleep, appetite, energy</T>
                </View>
                <Icon name="chevron" color={colors.haze} />
              </Card>
            </Pressable>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <Pill text="Checked in today" tone="mint" icon="check" />
            </View>
          )}

          <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <View>
              <T v="label">From the plan</T>
              <T v="h2">Step by step today</T>
            </View>
            <Pressable onPress={() => router.push("/plan")} accessibilityRole="link" hitSlop={8} testID="open-plan">
              <T v="small" style={{ color: colors.ember, fontFamily: fonts.semibold }}>
                Full plan
              </T>
            </Pressable>
          </Row>
          {tickError ? <ErrorBox message={tickError} /> : null}
          {t.items.length === 0 ? (
            <Card tone="plain">
              <T v="small">Nothing scheduled for today. Rest counts too.</T>
            </Card>
          ) : (
            t.items.map((it, i) => <StepCard key={`${it.item_id}|${it.slot}`} item={it} index={i} busy={pending === `${it.item_id}|${it.slot}`} onToggle={(d) => void toggle(it.item_id, it.slot, d)} />)
          )}
          <Disclaimer />
        </>
      ) : null}
    </Screen>
  );
}

function NoJourney() {
  return (
    <Screen testID="no-journey">
      <Card style={{ marginTop: 20 }}>
        <Icon name="key" size={28} color={colors.ember} />
        <T v="h2" style={{ marginTop: 10 }}>
          Enter the code from your care team
        </T>
        <T v="small" style={{ marginTop: 6, marginBottom: 16 }}>
          Your plan appears here once you join it with the 8-character code your nurse or doctor gave you.
        </T>
        <Button label="Enter my code" icon="arrowR" onPress={() => router.push("/redeem")} testID="go-redeem" />
      </Card>
    </Screen>
  );
}
