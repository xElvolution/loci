import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Icon } from "@/components/Icon";
import { Button, CallButtons, Card, ErrorBox, Field, Pill, Row, Screen, Skeleton, T, Title } from "@/components/ui";
import type { ApiError } from "@/lib/api/client";
import type { ContactInfo, Message } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { colors, fonts, radius } from "@/theme";

export default function Ask() {
  const { api } = useAuth();
  const q = useApi<{ messages: Message[]; contact: ContactInfo }>(async () => {
    const [m, contact] = await Promise.all([api.messages("current"), api.contact("current")]);
    return { messages: m.messages, contact };
  });
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"question" | "message">("question");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = q.data;
  const team = data?.contact.care_team_name || "your care team";

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.sendMessage("current", body.trim(), kind);
      q.setData((d) => (d ? { ...d, messages: [...d.messages, r.message] } : d));
      setBody("");
    } catch (e) {
      const err = e as ApiError;
      setError(err.code === "no_team" ? `${team} isn't reading messages on loci. Call them instead.` : err.status === 403 ? "Family members can read the thread. The patient or a main caregiver writes to the care team." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.night }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="ask">
        <Title eyebrow="Ask my care team" title="Questions," accent="answered by people." />
        {q.loading && !data ? <Skeleton height={260} /> : null}
        {q.error && !data ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
        {data ? (
          <>
            {!data.contact.team_on_loci ? (
              <Card tone="ember" style={{ marginBottom: 14 }}>
                <T v="small" style={{ color: colors.text }}>
                  {team} isn&apos;t reading messages on loci. Call them for questions.
                </T>
              </Card>
            ) : null}
            {data.messages.length === 0 ? (
              <Card tone="plain" style={{ marginBottom: 14 }}>
                <T v="small">No messages yet. Ask anything about your plan: a step that is unclear, a side effect you want to mention at the next visit, a question about timing.</T>
              </Card>
            ) : (
              <View style={{ gap: 10, marginBottom: 16 }} testID="thread">
                {data.messages.map((m) => (
                  <Bubble key={m.id} m={m} />
                ))}
              </View>
            )}
            <Card>
              <Row style={{ marginBottom: 12, gap: 8 }}>
                {(["question", "message"] as const).map((k) => (
                  <Pressable key={k} onPress={() => setKind(k)} accessibilityRole="radio" accessibilityState={{ checked: kind === k }} aria-checked={kind === k} testID={`kind-${k}`} style={{ paddingHorizontal: 14, height: 38, borderRadius: 19, justifyContent: "center", borderWidth: 1, borderColor: kind === k ? colors.ember : colors.line, backgroundColor: kind === k ? "rgba(255,193,94,0.15)" : "transparent" }}>
                    <T v="small" style={{ color: kind === k ? colors.text : colors.haze, fontFamily: fonts.semibold }}>
                      {k === "question" ? "Question" : "Note"}
                    </T>
                  </Pressable>
                ))}
              </Row>
              <Field label={kind === "question" ? `Ask ${team}` : `A note for ${team}`} value={body} onChangeText={(t) => setBody(t.slice(0, 2000))} multiline placeholder={kind === "question" ? "Can I shower yet with the dressing on?" : "Walked to the corner shop today"} testID="message-body" />
              <Row style={{ alignItems: "flex-start", marginBottom: 12, marginTop: -4 }}>
                <Icon name="alert" size={14} color={colors.coral} />
                <T v="tiny" style={{ flex: 1 }}>
                  For anything urgent, call your care team or the emergency number. Messages are not watched around the clock.
                </T>
              </Row>
              {error ? <ErrorBox message={error} /> : null}
              <Button label="Send" icon="send" disabled={!body.trim()} busy={busy} onPress={() => void send()} testID="send" />
            </Card>
            <CallButtons phone={data.contact.care_team_phone} team={data.contact.care_team_name} emergency={data.contact.emergency_number} />
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m }: { m: Message }) {
  const mine = m.side === "patient";
  const update = m.kind === "update";
  return (
    <View style={{ alignSelf: update ? "stretch" : mine ? "flex-end" : "flex-start", maxWidth: update ? "100%" : "86%" }}>
      <View style={{ borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: update ? "rgba(255,193,94,0.35)" : mine ? "rgba(255,193,94,0.25)" : colors.line, backgroundColor: update ? "rgba(255,193,94,0.08)" : mine ? "rgba(255,193,94,0.12)" : colors.dusk800, borderBottomRightRadius: mine && !update ? 6 : radius.md, borderBottomLeftRadius: !mine && !update ? 6 : radius.md }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
          <T v="tiny" style={{ color: mine ? colors.ember : colors.lilac, fontFamily: fonts.semibold, flexShrink: 1 }} numberOfLines={1}>
            {update ? "Plan update" : m.name || (mine ? "You" : "Care team")}
          </T>
          {m.kind === "question" ? <Pill text={m.resolved_at ? "Answered" : "Question"} tone={m.resolved_at ? "mint" : "haze"} /> : null}
        </Row>
        <T style={{ fontSize: 15 }}>{m.body}</T>
        <T v="tiny" style={{ marginTop: 4, textAlign: mine ? "right" : "left" }}>
          {relativeTime(m.created_at)}
        </T>
      </View>
    </View>
  );
}
