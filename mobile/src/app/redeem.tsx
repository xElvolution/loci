import { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { router } from "expo-router";
import { BackHeader } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { Button, Card, ErrorBox, Field, Row, Screen, T, Title } from "@/components/ui";
import { normalizeCode, type ApiError } from "@/lib/api/client";
import type { CodeInfo } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/theme";

export default function Redeem() {
  const { api } = useAuth();
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<CodeInfo | null>(null);
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = normalizeCode(code);
  const ready = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(clean);

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      setInfo(await api.checkCode(clean));
    } catch (e) {
      const err = e as ApiError;
      setError(err.code === "invalid_code" || err.status === 404 ? "That code didn't work. Check it with your care team: codes are 8 letters and numbers and work once, for 30 days." : err.message);
    } finally {
      setBusy(false);
    }
  };
  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.redeem(clean, share);
      router.replace("/?joined=1");
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <BackHeader title="Care team code" />
      <Screen testID="redeem">
        <Title eyebrow="Join your plan" title="Enter the code from" accent="your care team." />
        <T v="small" style={{ marginTop: -6, marginBottom: 18, fontSize: 15 }}>
          Your nurse or doctor gives you an 8-character code, like ABCD-EFGH, on paper or by text. It links this app to the plan they wrote for you.
        </T>
        {!info ? (
          <Card>
            <Field label="Code" value={code} onChangeText={(t) => setCode(t.toUpperCase().slice(0, 9))} autoCapitalize="characters" autoCorrect={false} placeholder="ABCD-EFGH" testID="code" style={{ fontFamily: fonts.mono, fontSize: 22, letterSpacing: 3, textAlign: "center" }} onSubmitEditing={() => ready && void check()} />
            {error ? <ErrorBox message={error} /> : null}
            <Button label="Check code" icon="key" disabled={!ready} busy={busy} onPress={() => void check()} testID="check-code" />
          </Card>
        ) : (
          <Card tone="mint">
            <Row>
              <Icon name="check" color={colors.mint} />
              <T v="title" style={{ flex: 1 }}>
                Code found
              </T>
            </Row>
            <T style={{ marginTop: 8 }}>
              {info.care_team_name || "Your care team"} wrote a plan for {info.person_name}. You&apos;ll join as {info.role === "patient" ? "the patient" : `a ${info.role}`}.
            </T>
            <Pressable onPress={() => setShare(!share)} accessibilityRole="switch" accessibilityState={{ checked: share }} aria-checked={share} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, padding: 14, borderRadius: 16, backgroundColor: "rgba(11,10,31,0.5)" }}>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.semibold }}>Share check-ins with my care team</T>
                <T v="tiny" style={{ marginTop: 2 }}>
                  So they can follow along and adjust the plan. You can change this later.
                </T>
              </View>
              <Switch value={share} onValueChange={setShare} trackColor={{ true: colors.mint, false: colors.dusk700 }} thumbColor={colors.soft} />
            </Pressable>
            {error ? <ErrorBox message={error} /> : null}
            <Button label="Join my plan" icon="arrowR" busy={busy} onPress={() => void join()} style={{ marginTop: 16 }} testID="join" />
          </Card>
        )}
      </Screen>
    </View>
  );
}
