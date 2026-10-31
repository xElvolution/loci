import { Linking, View } from "react-native";
import { BackHeader } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { Card, ErrorBox, GhostButton, Pill, Row, Screen, Skeleton, T, Title } from "@/components/ui";
import { API_ORIGIN } from "@/lib/api/client";
import type { ContactInfo, Me } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { colors, fonts } from "@/theme";

const ROLE: Record<string, string> = { patient: "Patient", caregiver: "Main caregiver", family: "Family", clinician: "Care team" };

export default function CircleScreen() {
  const { api } = useAuth();
  // The v1 API has no circle endpoint yet: show who you are and the plans you're part of,
  // and hand invites and roles to the web app.
  const q = useApi<{ me: Me; contact: ContactInfo | null }>(async () => {
    const [me, contact] = await Promise.all([api.me(), api.contact("current").catch(() => null)]);
    return { me, contact };
  });
  const d = q.data;
  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <BackHeader title="Care circle" />
      <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="circle">
        <Title eyebrow="Care circle" title="The people" accent="walking home with you." />
        <T v="small" style={{ marginTop: -6, marginBottom: 16 }}>
          Family and friends in your circle see the plan and check-ins, so nobody has to ask &quot;how was today?&quot; five times.
        </T>
        {q.loading && !d ? <Skeleton height={200} /> : null}
        {q.error && !d ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
        {d ? (
          <>
            <Card style={{ gap: 12, marginBottom: 16 }}>
              <Member name={`${d.me.user.display_name} (you)`} role={d.me.user.email ?? (d.me.user.is_demo ? "Demo account" : "")} />
              {d.me.journeys.map((j) => (
                <Row key={j.id} style={{ justifyContent: "space-between" }}>
                  <T v="small" style={{ flex: 1 }}>
                    {j.person_name}&apos;s plan · {j.specialty}
                  </T>
                  <Pill text={(ROLE[j.role] ?? j.role) + (j.is_current ? " · current" : "")} tone={j.is_current ? "mint" : "haze"} />
                </Row>
              ))}
              {d.contact ? <Member name={d.contact.care_team_name || "Your care team"} role={ROLE.clinician} sub={d.contact.sharing_with_team ? "Sees your check-ins" : "Not seeing your check-ins"} /> : null}
            </Card>
            <Card tone="ember">
              <Row style={{ alignItems: "flex-start" }}>
                <Icon name="users" color={colors.ember} />
                <View style={{ flex: 1 }}>
                  <T v="title">Invite someone</T>
                  <T v="small" style={{ marginTop: 4, color: colors.text }}>
                    Invites, roles and errands are managed in the web app for now. Each invite is a single-use link you choose who to send to.
                  </T>
                </View>
              </Row>
              <GhostButton label="Open care circle on the web" icon="arrowR" style={{ marginTop: 12, minHeight: 46 }} onPress={() => void Linking.openURL(`${API_ORIGIN}/app/circle`)} testID="circle-web" />
            </Card>
          </>
        ) : null}
      </Screen>
    </View>
  );
}

function Member({ name, role, sub }: { name: string; role: string; sub?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <Row>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.dusk700, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.lineStrong }}>
        <T style={{ fontFamily: fonts.bold, color: colors.ember }}>{initials}</T>
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
          {name}
        </T>
        <T v="tiny" numberOfLines={1}>
          {[role, sub].filter(Boolean).join(" · ")}
        </T>
      </View>
    </Row>
  );
}
