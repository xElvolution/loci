import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, ErrorBox, Field, GhostButton, Row, Screen, T, Title } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Wordmark } from "@/components/Wordmark";
import { RoadArt } from "@/components/Road";
import { ApiError } from "@/lib/api/client";
import { deviceTimezone, useAuth } from "@/lib/auth";
import { colors, fonts } from "@/theme";

type Mode = "start" | "signin" | "signup";

export default function Welcome() {
  const { api, accept } = useAuth();
  const [mode, setMode] = useState<Mode>("start");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "form" | "demo">(null);
  const [error, setError] = useState<string | null>(null);
  const [then, setThen] = useState<"today" | "redeem">("today");

  const go = async (kind: "form" | "demo") => {
    setBusy(kind);
    setError(null);
    try {
      const r = kind === "demo" ? await api.demo(deviceTimezone()) : mode === "signup" ? await api.signup(name.trim(), email.trim(), password, deviceTimezone()) : await api.signin(email.trim(), password);
      await accept(r);
      router.replace(kind === "form" && then === "redeem" ? "/redeem" : "/");
    } catch (e) {
      const err = e as ApiError;
      setError(err.code === "clinician_account" ? "This is a clinician account. Clinicians use the loci web workspace." : err.message);
    } finally {
      setBusy(null);
    }
  };

  const valid = mode === "signup" ? name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length >= 10 : /\S+@\S+\.\S+/.test(email) && password.length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.night }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen header={false} testID="welcome">
        <View style={{ alignItems: "flex-start", marginTop: 8 }}>
          <Wordmark width={132} />
        </View>
        <View style={{ marginTop: 28 }}>
          <Title eyebrow="For patients and families" title="The way home," accent="one step at a time." size={36} />
          <T v="small" style={{ fontSize: 16, lineHeight: 23, marginTop: -6 }}>
            Follow the plan your care team wrote for you: what to do today, why they asked, and how. Check in once a day and know exactly when to call.
          </T>
        </View>
        <RoadArt />

        {mode === "start" ? (
          <View style={{ gap: 12 }}>
            <Button
              label="I have a code from my care team"
              icon="key"
              testID="start-code"
              onPress={() => {
                setThen("redeem");
                setMode("signup");
              }}
            />
            <GhostButton label="Sign in" icon="arrowR" testID="start-signin" onPress={() => setMode("signin")} />
            <GhostButton label="Try the demo" icon="spark" busy={busy === "demo"} testID="start-demo" onPress={() => void go("demo")} />
            <T v="tiny" style={{ textAlign: "center", marginTop: 4 }}>
              The demo is a real 24-hour account: Daniel, nine days after a knee replacement.
            </T>
            {error ? <ErrorBox message={error} /> : null}
          </View>
        ) : (
          <Card>
            <Row style={{ marginBottom: 14, justifyContent: "space-between" }}>
              <T v="h2">{mode === "signin" ? "Welcome back" : "Create your account"}</T>
              <Pressable onPress={() => setMode("start")} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
                <Icon name="back" color={colors.haze} />
              </Pressable>
            </Row>
            {mode === "signup" && then === "redeem" ? (
              <T v="small" style={{ marginBottom: 14 }}>
                First an account, so your plan stays yours. Next you enter the code.
              </T>
            ) : null}
            {mode === "signup" ? <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="First name is fine" testID="name" /> : null}
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" testID="email" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "signup" ? "new-password" : "current-password"} textContentType={mode === "signup" ? "newPassword" : "password"} hint={mode === "signup" ? "At least 10 characters" : undefined} testID="password" onSubmitEditing={() => valid && void go("form")} />
            {error ? <ErrorBox message={error} /> : null}
            <Button label={mode === "signin" ? "Sign in" : "Create account"} busy={busy === "form"} disabled={!valid} onPress={() => void go("form")} testID="submit" />
            <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")} accessibilityRole="button" style={{ marginTop: 14, alignSelf: "center" }}>
              <T v="small">
                {mode === "signin" ? "New here? " : "Have an account? "}
                <T v="small" style={{ color: colors.ember, fontFamily: fonts.semibold }}>
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </T>
              </T>
            </Pressable>
          </Card>
        )}
        <T v="tiny" style={{ marginTop: 22, textAlign: "center" }}>
          loci shows your care team&apos;s plan. It never gives medical advice. In an emergency, call your local emergency number.
        </T>
      </Screen>
    </KeyboardAvoidingView>
  );
}
