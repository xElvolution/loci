"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/app/actions";
import { Button } from "@/components/ui/primitives";

export function JoinForm({ code, orgName, isOrgInvite, askConsent, teamPlan = false }: { code: string; orgName: string | null; isOrgInvite: boolean; askConsent: boolean; teamPlan?: boolean }) {
  const [consent, setConsent] = useState(teamPlan);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await acceptInviteAction(code, consent);
          if (!r.ok) setErr(r.error);
          else router.push(r.redirectTo);
        });
      }}
    >
      {!isOrgInvite && (
        <label className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#ffc15e]" required data-testid="join-agree" />
          <span>I understand loci shows the plan from the care team and does not give medical advice. In an emergency I will call the local emergency number.</span>
        </label>
      )}
      {askConsent && orgName && (
        <label className="flex items-start gap-3 rounded-2xl border border-mint/25 bg-mint/[0.05] p-4 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#7cf5d3]" data-testid="join-consent" />
          {teamPlan ? (
            <span>
              Let <span className="font-semibold">{orgName}</span> see my tick-offs, check-ins, notes and questions so they can follow my recovery. You can turn this off later from the care circle; they then stop seeing updates. Your comfort and taste settings are never shared with them.
            </span>
          ) : (
            <span>
              Share check-ins, plan progress and flags with <span className="font-semibold">{orgName}</span>. Optional, and you can turn it off later from the care circle.
            </span>
          )}
        </label>
      )}
      {err && <p className="text-sm text-coral">{err}</p>}
      <Button type="submit" disabled={pending || (!isOrgInvite && !agree)} className="w-full" data-testid="join-accept">
        {pending ? "Joining" : isOrgInvite ? "Join the care team" : teamPlan ? "Get my plan" : "Join the care circle"}
      </Button>
    </form>
  );
}
