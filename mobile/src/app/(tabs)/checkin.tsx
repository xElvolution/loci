import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { Icon } from "@/components/Icon";
import { Button, CallButtons, Card, Disclaimer, ErrorBox, Field, GhostButton, Row, Screen, Skeleton, T, Title } from "@/components/ui";
import type { CheckinResult, ContactInfo, Plan } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { EMPTY_DRAFT, isComplete, toInput, toggleSign, type Draft } from "@/lib/checkin";
import { useApi } from "@/lib/useApi";
import { WhenToCall } from "@/components/WhenToCall";
import { colors, fonts, radius } from "@/theme";

const FACES = ["M8 16.5c1.2-1.6 2.5-2.2 4-2.2s2.8.6 4 2.2", "M8.5 16c1-1 2.2-1.4 3.5-1.4s2.5.4 3.5 1.4", "M8.5 15.5h7", "M8.5 14.5c1 1 2.2 1.4 3.5 1.4s2.5-.4 3.5-1.4", "M8 14c1.2 1.8 2.5 2.6 4 2.6s2.8-.8 4-2.6"];
const SCALES: { metric: "mood" | "sleep" | "appetite" | "energy"; q: string; low: string; high: string; faces?: boolean }[] = [
  { metric: "mood", q: "How is your mood today?", low: "Very low", high: "Great", faces: true },
  { metric: "sleep", q: "How did you sleep?", low: "Barely slept", high: "Rested" },
  { metric: "appetite", q: "How is your appetite?", low: "None", high: "Hungry" },
  { metric: "energy", q: "How is your energy?", low: "Drained", high: "Lively" },
];

type Data = { plan: Plan; contact: ContactInfo; todayDone: boolean };

export default function CheckIn() {
  const { api } = useAuth();
  const q = useApi<Data>(async () => {
    const [plan, contact, list] = await Promise.all([api.plan("current"), api.contact("current"), api.checkins("current", 1)]);
    return { plan, contact, todayDone: list.today_done };
  });
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.checkin("current", toInput(d)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const data = q.data;
  if (result && data) return <Result r={result} contact={data.contact} onAgain={() => setResult(null)} />;

  return (
    <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="checkin">
      <Title eyebrow="Daily check-in" title="How is today" accent="going?" />
      {q.loading && !data ? <Skeleton height={300} /> : null}
      {q.error && !data ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
      {data ? (
        <>
          <WhenToCall signs={data.plan.warning_signs} contact={data.contact} />
          {data.todayDone ? (
            <Card tone="mint" style={{ marginBottom: 14 }}>
              <Row>
                <Icon name="check" color={colors.mint} />
                <T style={{ flex: 1 }}>You already checked in today. Saving again replaces today&apos;s answers.</T>
              </Row>
            </Card>
          ) : null}
          {SCALES.slice(0, 1).map((s) => (
            <Scale key={s.metric} {...s} value={d[s.metric]} onChange={(n) => setD({ ...d, [s.metric]: n })} />
          ))}
          <Card style={{ marginBottom: 14 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="title" style={{ flex: 1 }}>
                How much pain right now?
              </T>
              <T style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.ember }}>{d.pain < 0 ? "?" : d.pain}</T>
            </Row>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }} accessibilityRole="radiogroup">
              {Array.from({ length: 11 }, (_, n) => {
                const on = d.pain === n;
                return (
                  <Pressable key={n} onPress={() => setD({ ...d, pain: n })} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`Pain ${n} of 10${n === 0 ? ", none" : n === 10 ? ", worst imaginable" : ""}`} testID={`pain-${n}`} style={{ width: "13%", minWidth: 40, flexGrow: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", borderColor: on ? colors.ember : colors.line, backgroundColor: on ? "rgba(255,193,94,0.18)" : "transparent" }}>
                    <T style={{ fontFamily: fonts.bold, color: on ? colors.text : colors.haze }}>{n}</T>
                  </Pressable>
                );
              })}
            </View>
            <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
              <T v="tiny">0 none</T>
              <T v="tiny">10 worst imaginable</T>
            </Row>
          </Card>
          {SCALES.slice(1).map((s) => (
            <Scale key={s.metric} {...s} value={d[s.metric]} onChange={(n) => setD({ ...d, [s.metric]: n })} />
          ))}
          {data.plan.warning_signs.length ? (
            <Card tone="coral" style={{ marginBottom: 14 }}>
              <T v="title">Is any of this happening now?</T>
              <T v="tiny" style={{ marginTop: 2, marginBottom: 10 }}>
                The warning signs from your plan, in your care team&apos;s words.
              </T>
              {data.plan.warning_signs.map((s, i) => {
                const on = d.signs.includes(s.id);
                return (
                  <Pressable key={s.id} onPress={() => setD(toggleSign(d, s.id))} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} testID={`sign-${i}`} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8, borderColor: on ? colors.coral : colors.line, backgroundColor: on ? "rgba(255,107,90,0.15)" : "transparent" }}>
                    <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: on ? colors.coral : colors.haze + "66", backgroundColor: on ? colors.coral : "transparent", alignItems: "center", justifyContent: "center" }}>{on ? <Icon name="check" size={15} color={colors.night} strokeWidth={2.6} /> : null}</View>
                    <T style={{ flex: 1, fontSize: 15 }}>{s.text}</T>
                  </Pressable>
                );
              })}
            </Card>
          ) : null}
          <Card style={{ marginBottom: 14 }}>
            <Field label="Anything else? (optional)" value={d.note} onChangeText={(note) => setD({ ...d, note: note.slice(0, 600) })} multiline placeholder="A good moment, a worry, a question for the next visit" hint="Visible to your care circle, and to your care team if you share with them." testID="note" />
          </Card>
          {error ? <ErrorBox message={error} /> : null}
          <Button label={isComplete(d) ? "Save today's check-in" : "Answer each question to save"} disabled={!isComplete(d)} busy={busy} onPress={() => void save()} testID="save-checkin" />
          <Disclaimer />
        </>
      ) : null}
    </Screen>
  );
}

function Scale({ metric, q, low, high, faces, value, onChange }: (typeof SCALES)[number] & { value: number; onChange: (n: number) => void }) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <T v="title">{q}</T>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }} accessibilityRole="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n;
          return (
            <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`${n} of 5${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ""}`} testID={`${metric}-${n}`} style={{ flex: 1, height: 58, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", borderColor: on ? colors.ember : colors.line, backgroundColor: on ? "rgba(255,193,94,0.15)" : "transparent" }}>
              {faces ? (
                <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={on ? colors.text : colors.haze} strokeWidth={1.6} strokeLinecap="round">
                  <Circle cx={12} cy={12} r={9.5} />
                  <Circle cx={9} cy={10} r={0.9} fill={on ? colors.text : colors.haze} />
                  <Circle cx={15} cy={10} r={0.9} fill={on ? colors.text : colors.haze} />
                  <Path d={FACES[n - 1]} />
                </Svg>
              ) : (
                <T style={{ fontFamily: fonts.bold, fontSize: 19, color: on ? colors.text : colors.haze }}>{n}</T>
              )}
            </Pressable>
          );
        })}
      </View>
      <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
        <T v="tiny">{low}</T>
        <T v="tiny">{high}</T>
      </Row>
    </Card>
  );
}

function Result({ r, contact, onAgain }: { r: CheckinResult; contact: ContactInfo; onAgain: () => void }) {
  const esc = r.escalation;
  return (
    <Screen testID="checkin-result">
      {esc ? (
        <Card tone="coral" style={{ marginTop: 8 }}>
          <Row style={{ alignItems: "flex-start" }}>
            <Icon name="alert" size={26} color={colors.coral} />
            <T v="h2" style={{ flex: 1, color: esc.action === "emergency" ? colors.coral : colors.text }} accessibilityRole="alert">
              {esc.action === "emergency" ? "Call the emergency number now" : `Call ${contact.care_team_name || "your care team"} today`}
            </T>
          </Row>
          <T style={{ marginTop: 10 }}>{esc.message}</T>
          {r.flags.map((f, i) => (
            <T key={i} v="small" style={{ marginTop: 6, color: "#F8E3DE" }}>
              • {f.reason}
            </T>
          ))}
          <CallButtons phone={esc.care_team_phone || contact.care_team_phone} team={contact.care_team_name} emergency={esc.emergency_number || contact.emergency_number} testID="escalation-calls" />
          <T v="tiny" style={{ marginTop: 12 }}>
            This matched a warning sign or threshold your care team set. loci does not judge how serious it is; your care team does.
          </T>
        </Card>
      ) : (
        <Card tone="mint" style={{ marginTop: 8, alignItems: "center" }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={32} color={colors.night} strokeWidth={2.6} />
          </View>
          <T v="h2" style={{ marginTop: 14, textAlign: "center" }}>
            Checked in. {r.streak > 1 ? `${r.streak} days in a row.` : "Day one of the streak."}
          </T>
          <T v="small" style={{ marginTop: 6, textAlign: "center" }}>
            Nothing you shared matched the warning signs or thresholds in your plan. Small steps count.
          </T>
        </Card>
      )}
      <View style={{ gap: 10, marginTop: 18 }}>
        {esc ? <GhostButton label="See today's good-day plan" icon="spark" onPress={() => router.push("/comfort")} /> : <Button label="See today's good-day plan" icon="spark" onPress={() => router.push("/comfort")} />}
        <GhostButton label="Back to today" onPress={() => router.push("/")} />
        <GhostButton label="Edit today's answers" onPress={onAgain} />
      </View>
      <Disclaimer />
    </Screen>
  );
}
