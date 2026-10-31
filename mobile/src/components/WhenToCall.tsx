import { useState } from "react";
import { Pressable, View } from "react-native";
import type { ContactInfo, WarningSign } from "@/lib/api/types";
import { colors } from "@/theme";
import { Icon } from "./Icon";
import { CallButtons, Card, Row, T } from "./ui";

/** Always visible: when to call, in the team's words, with one-tap call buttons. */
export function WhenToCall({ signs, contact }: { signs: WarningSign[]; contact: ContactInfo }) {
  const [open, setOpen] = useState(false);
  const em = signs.filter((s) => s.action === "emergency");
  const team = signs.filter((s) => s.action !== "emergency");
  return (
    <Card tone="plain" style={{ marginBottom: 16, borderColor: "rgba(255,107,90,0.35)" }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} testID="when-to-call">
        <Row>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,107,90,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="phone" size={18} color={colors.coral} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="title">When to call</T>
            <T v="tiny">{signs.length ? `${signs.length} signs your team asked you to watch for` : "Your team's numbers, one tap away"}</T>
          </View>
          <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
            <Icon name="chevronDown" color={colors.haze} />
          </View>
        </Row>
      </Pressable>
      {open ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          {em.length ? <SignList title="Call the emergency number if" items={em} tone={colors.coral} /> : null}
          {team.length ? <SignList title={`Call ${contact.care_team_name || "your care team"} if`} items={team} tone={colors.ember} /> : null}
        </View>
      ) : null}
      <CallButtons phone={contact.care_team_phone} team={contact.care_team_name} emergency={contact.emergency_number} />
    </Card>
  );
}

function SignList({ title, items, tone }: { title: string; items: WarningSign[]; tone: string }) {
  return (
    <View>
      <T v="label" style={{ color: tone, marginBottom: 6 }}>
        {title}
      </T>
      {items.map((s) => (
        <Row key={s.id} style={{ alignItems: "flex-start", marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone, marginTop: 8 }} />
          <T v="small" style={{ flex: 1, color: colors.text }}>
            {s.text}
          </T>
        </Row>
      ))}
    </View>
  );
}

