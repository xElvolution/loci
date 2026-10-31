import { useMemo } from "react";
import { Linking, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { Icon, type IconName } from "@/components/Icon";
import { Card, ErrorBox, GhostButton, Pill, Row, Screen, Skeleton, T, Title } from "@/components/ui";
import { API_ORIGIN } from "@/lib/api/client";
import type { Comfort, Pick, Today } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { becauseLine } from "@/lib/format";
import { composeGoodDay } from "@/lib/goodday";
import { useApi } from "@/lib/useApi";
import { colors, fonts, radius } from "@/theme";

const SECTIONS: { key: "soundtrack" | "screen" | "reading" | "meals" | "outings"; title: string; icon: IconName; tone: string }[] = [
  { key: "soundtrack", title: "Soundtrack", icon: "music", tone: colors.ember },
  { key: "screen", title: "Screen", icon: "film", tone: colors.lilac },
  { key: "reading", title: "Reading and listening", icon: "book", tone: colors.mint },
  { key: "meals", title: "Meals near home", icon: "food", tone: colors.coral },
  { key: "outings", title: "Gentle outings", icon: "map", tone: "#8AD4FF" },
];
const SOURCE = { plan: { tone: colors.lilac, label: "Plan" }, comfort: { tone: colors.ember, label: "Comfort" }, checkin: { tone: colors.mint, label: "Check-in" } } as const;

export default function ComfortScreen() {
  const { api } = useAuth();
  const q = useApi<{ comfort: Comfort; today: Today }>(async () => {
    const [comfort, today] = await Promise.all([api.comfort("current"), api.today("current")]);
    return { comfort, today };
  });
  const data = q.data;
  const day = useMemo(() => (data ? composeGoodDay({ date: data.today.date, personName: data.today.person_name, items: data.today.items, comfort: data.comfort.sections ?? {}, checkinDone: data.today.checkin_done }) : []), [data]);

  return (
    <Screen onRefresh={() => void q.reload()} refreshing={q.refreshing} testID="comfort">
      <Title eyebrow="Comfort, with Qloo taste AI" title="A good day," accent="built around you." />
      <Row style={{ alignItems: "flex-start", marginTop: -6, marginBottom: 16 }}>
        <Icon name="shield" size={15} color={colors.mint} />
        <T v="tiny" style={{ flex: 1 }}>
          Picks are aggregate taste affinity: what people with similar taste tend to enjoy. They are for comfort only and never shape your medical plan.
        </T>
      </Row>
      {q.loading && !data ? (
        <>
          <Skeleton height={220} />
          <Skeleton height={170} />
          <Skeleton height={170} />
        </>
      ) : null}
      {q.error && !data ? <ErrorBox message={q.error.message} onRetry={() => void q.reload()} /> : null}
      {data ? (
        <>
          <T v="h2" style={{ marginBottom: 10 }}>
            Today&apos;s good-day plan
          </T>
          <Card style={{ marginBottom: 20 }} >
            {day.map((b, i) => (
              <View key={b.key} style={{ flexDirection: "row", gap: 12, paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: "rgba(255,255,255,0.06)" }} testID={`goodday-${i}`}>
                <T v="mono" style={{ width: 62, fontSize: 12, color: colors.haze, marginTop: 2 }}>
                  {b.time}
                </T>
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{b.title}</T>
                  <T v="tiny" style={{ marginTop: 1 }}>
                    {b.detail}
                  </T>
                </View>
                <View style={{ alignSelf: "flex-start" }}>
                  <Pill text={SOURCE[b.source].label} tone={b.source === "plan" ? "lilac" : b.source === "comfort" ? "ember" : "mint"} />
                </View>
              </View>
            ))}
            <T v="tiny" style={{ marginTop: 8 }}>
              Plan lines come straight from your care team&apos;s plan. loci only adds comfort around them.
            </T>
          </Card>

          {data.comfort.status !== "ok" ? <StatusNote status={data.comfort.status} /> : null}
          {SECTIONS.map((s) => {
            const list = data.comfort.sections?.[s.key] ?? [];
            if (!list.length) return null;
            return (
              <View key={s.key} style={{ marginBottom: 18 }}>
                <Row style={{ marginBottom: 10 }}>
                  <Icon name={s.icon} size={18} color={s.tone} />
                  <T v="title">{s.title}</T>
                </Row>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }} style={{ marginRight: -18 }}>
                  {list.slice(0, 8).map((p) => (
                    <PickCard key={p.id} p={p} tone={s.tone} icon={s.icon} />
                  ))}
                </ScrollView>
              </View>
            );
          })}
          {data.comfort.sections?.cuisines?.length ? (
            <View style={{ marginBottom: 12 }}>
              <T v="title" style={{ marginBottom: 8 }}>
                Cuisines your taste leans toward
              </T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {data.comfort.sections.cuisines.slice(0, 10).map((c) => (
                  <Pill key={c.id} text={c.name} tone="coral" />
                ))}
              </View>
            </View>
          ) : null}
          <T v="tiny" style={{ marginTop: 6 }}>
            {data.comfort.label || "Aggregate taste affinity from Qloo. Not advice."}
          </T>
        </>
      ) : null}
    </Screen>
  );
}

function PickCard({ p, tone, icon }: { p: Pick; tone: string; icon: IconName }) {
  return (
    <View style={{ width: 168, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass, overflow: "hidden" }}>
      <View style={{ height: 112, backgroundColor: colors.dusk800, alignItems: "center", justifyContent: "center" }}>
        {p.image ? <Image source={{ uri: p.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} accessibilityIgnoresInvertColors /> : <Icon name={icon} size={34} color={tone} />}
      </View>
      <View style={{ padding: 12 }}>
        <T style={{ fontFamily: fonts.semibold, fontSize: 15 }} numberOfLines={2}>
          {p.name}
        </T>
        {p.subtitle && p.subtitle !== p.name ? (
          <T v="tiny" numberOfLines={1} style={{ marginTop: 2 }}>
            {p.subtitle}
          </T>
        ) : null}
        {becauseLine(p.because) ? (
          <T v="tiny" numberOfLines={2} style={{ marginTop: 6, color: tone }}>
            {becauseLine(p.because)}
          </T>
        ) : null}
      </View>
    </View>
  );
}

function StatusNote({ status }: { status: Comfort["status"] }) {
  const text = {
    ok: "",
    no_favorites: "Add a few favorites (an artist, a show, a book) to tune the picks. You can do that on the web app's Comfort page.",
    no_city: "Add your city on the web app's Comfort page for meals and gentle outings near home.",
    unavailable: "Comfort picks are taking a break right now. Your plan and check-ins work as normal.",
  }[status];
  return (
    <Card tone="ember" style={{ marginBottom: 16 }}>
      <T v="small" style={{ color: colors.text }}>
        {text}
      </T>
      {status !== "unavailable" ? <GhostButton label="Open Comfort on the web" icon="arrowR" style={{ marginTop: 10, alignSelf: "flex-start", minHeight: 44 }} onPress={() => void Linking.openURL(`${API_ORIGIN}/app/comfort`)} /> : null}
    </Card>
  );
}
