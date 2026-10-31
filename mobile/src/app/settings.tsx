import { useEffect, useState } from "react";
import { Linking, Pressable, Switch, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { BackHeader } from "@/components/Header";
import { Icon, type IconName } from "@/components/Icon";
import { Card, Field, GhostButton, Pill, Row, Screen, T, Title } from "@/components/ui";
import { API_ORIGIN } from "@/lib/api/client";
import type { ContactInfo } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { prettyTime } from "@/lib/format";
import { CHECKIN_TIMES, DEFAULT_PREFS, loadPrefs, savePrefs, type ReminderPrefs } from "@/lib/prefs";
import { colors, fonts } from "@/theme";

export default function Settings() {
  const { api, user, signOut } = useAuth();
  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULT_PREFS);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [busy, setBusy] = useState<null | "signout">(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    void loadPrefs().then(setPrefs);
    api
      .contact("current")
      .then(setContact)
      .catch(() => undefined);
  }, [api]);

  const update = (p: Partial<ReminderPrefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    void savePrefs(next);
  };

  // Export and account deletion are not in the v1 mobile API yet; both run in the web app,
  // where the person signs in and confirms. Nothing is deleted from this phone first.
  const openWeb = (what: "export" | "delete") => {
    setNote(what === "export" ? "Opening the web app: sign in there and choose Export my data." : "Opening the web app: sign in there and choose Delete my account. Nothing has been deleted yet.");
    void Linking.openURL(`${API_ORIGIN}/app/settings`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <BackHeader title="Settings" />
      <Screen testID="settings">
        <Title eyebrow="Settings" title="Your account," accent="your choices." />
        <Card style={{ marginBottom: 16 }}>
          <T v="title">{user?.display_name}</T>
          {user?.email ? <T v="small">{user.email}</T> : null}
          <Row style={{ marginTop: 10, flexWrap: "wrap" }}>
            {user?.is_demo ? <Pill text="Demo account, deleted after 24 hours" tone="ember" /> : null}
            {contact ? <Pill text={contact.sharing_with_team ? "Sharing check-ins with your team" : "Not sharing with your team"} tone={contact.sharing_with_team ? "mint" : "haze"} icon="shield" /> : null}
          </Row>
        </Card>

        <T v="h2" style={{ marginBottom: 10 }}>
          Reminders
        </T>
        <Card style={{ marginBottom: 16, gap: 4 }}>
          <Toggle icon="today" label="Plan steps" sub="A nudge at each time your team set" value={prefs.plan} onChange={(v) => update({ plan: v })} testID="pref-plan" />
          <Toggle icon="heart" label="Daily check-in" sub={`Every day at ${prettyTime(prefs.checkinTime)}`} value={prefs.checkin} onChange={(v) => update({ checkin: v })} testID="pref-checkin" />
          {prefs.checkin ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 40, paddingBottom: 8 }}>
              {CHECKIN_TIMES.map((t) => (
                <Pressable key={t} onPress={() => update({ checkinTime: t })} accessibilityRole="radio" accessibilityState={{ checked: prefs.checkinTime === t }} aria-checked={prefs.checkinTime === t} style={{ paddingHorizontal: 12, height: 34, borderRadius: 17, justifyContent: "center", borderWidth: 1, borderColor: prefs.checkinTime === t ? colors.ember : colors.line, backgroundColor: prefs.checkinTime === t ? "rgba(255,193,94,0.15)" : "transparent" }}>
                  <T v="small" style={{ color: prefs.checkinTime === t ? colors.text : colors.haze }}>
                    {prettyTime(t)}
                  </T>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Toggle icon="chat" label="Replies from my care team" value={prefs.messages} onChange={(v) => update({ messages: v })} testID="pref-messages" />
          <Toggle icon="clock" label="Quiet hours" sub="Nothing between 10 pm and 7 am" value={prefs.quietHours} onChange={(v) => update({ quietHours: v })} testID="pref-quiet" />
          <T v="tiny" style={{ marginTop: 6 }}>
            Saved on this phone. Phone notifications are not switched on in this build yet; SMS and WhatsApp reminders are set up in the web app when your clinic has them connected.
          </T>
        </Card>

        <T v="h2" style={{ marginBottom: 10 }}>
          Your data
        </T>
        <Card style={{ marginBottom: 16, gap: 10 }}>
          <T v="small">Everything loci holds about your journey: plan, ticks, check-ins, messages, consent log. As a JSON file you keep.</T>
          <GhostButton label="Export my data" icon="download" onPress={() => openWeb("export")} testID="export" />
          {note ? (
            <T v="tiny" style={{ color: colors.mint }}>
              {note}
            </T>
          ) : null}
        </Card>

        <Card tone="coral" style={{ marginBottom: 16 }}>
          <T v="title">Delete account</T>
          <T v="small" style={{ marginTop: 4, color: colors.text }}>
            Removes your account and every journey you created. A plan your care team wrote stays with them; you leave it. This can&apos;t be undone. You confirm it in the web app.
          </T>
          {!confirm ? (
            <GhostButton label="Delete my account" icon="trash" tone="danger" style={{ marginTop: 12 }} onPress={() => setConfirm(true)} testID="delete" />
          ) : (
            <View style={{ marginTop: 12 }}>
              <Field label='Type "delete" to confirm' value={typed} onChangeText={setTyped} autoCapitalize="none" autoCorrect={false} testID="delete-confirm" />
              <Row>
                <GhostButton label="Cancel" style={{ flex: 1 }} onPress={() => (setConfirm(false), setTyped(""))} />
                <GhostButton label="Continue" icon="trash" tone="danger" style={{ flex: 1 }} disabled={typed.trim().toLowerCase() !== "delete"} onPress={() => openWeb("delete")} testID="delete-go" />
              </Row>
            </View>
          )}
        </Card>

        <GhostButton
          label="Sign out"
          icon="logout"
          busy={busy === "signout"}
          testID="signout"
          onPress={async () => {
            setBusy("signout");
            await signOut();
            router.replace("/welcome");
          }}
        />
        <Row style={{ justifyContent: "center", marginTop: 18, gap: 16 }}>
          <Pressable onPress={() => void Linking.openURL(`${API_ORIGIN}/privacy`)} accessibilityRole="link">
            <T v="tiny" style={{ color: colors.ember }}>
              Privacy
            </T>
          </Pressable>
          <Pressable onPress={() => void Linking.openURL(`${API_ORIGIN}/safety`)} accessibilityRole="link">
            <T v="tiny" style={{ color: colors.ember }}>
              Safe use
            </T>
          </Pressable>
        </Row>
        <T v="tiny" style={{ textAlign: "center", marginTop: 8, fontFamily: fonts.mono }}>
          loci {Constants.expoConfig?.version ?? ""}
        </T>
      </Screen>
    </View>
  );
}

function Toggle({ icon, label, sub, value, onChange, testID }: { icon: IconName; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} aria-checked={value} accessibilityLabel={label} testID={testID} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 }}>
      <Icon name={icon} size={20} color={colors.haze} />
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{label}</T>
        {sub ? <T v="tiny">{sub}</T> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.mint, false: colors.dusk700 }} thumbColor={colors.soft} />
    </Pressable>
  );
}
