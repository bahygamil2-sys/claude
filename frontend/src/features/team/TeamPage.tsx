import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Settings2 } from "lucide-react";
import { useTeam } from "./teamApi";
import type { TeamMember } from "./teamApi";
import { useBranches } from "@/features/branches/branchesApi";
import { InviteMemberModal } from "./InviteMemberModal";
import { EditAccessModal } from "./EditAccessModal";
import { useLocalized } from "@/hooks/useLocalized";
import { Button } from "@/components/Button";
import { Badge, BrandUserStatusBadge } from "@/components/Badge";
import { FullPageSpinner } from "@/components/Spinner";

const STATUS_LABEL_KEY: Record<string, string> = {
  ACTIVE: "dashboard:team.statusActive",
  INVITED: "dashboard:team.statusInvited",
  DISABLED: "dashboard:team.statusDisabled",
};

export default function TeamPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const pick = useLocalized();
  const teamQuery = useTeam();
  const branchesQuery = useBranches();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  if (teamQuery.isLoading || branchesQuery.isLoading) return <FullPageSpinner />;

  const members = teamQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const branchById = new Map(branches.map((b) => [b.id, b]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("dashboard:team.title")}</h1>
        <Button size="sm" onClick={() => setInviteOpen(true)} disabled={branches.length === 0}>
          <Plus size={15} className="me-1" />
          {t("dashboard:team.inviteManager")}
        </Button>
      </div>

      {members.every((m) => m.role !== "MANAGER") && <p className="text-sm text-neutral-500">{t("dashboard:team.empty")}</p>}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2 text-start">{t("dashboard:team.name")}</th>
              <th className="px-4 py-2 text-start">{t("dashboard:team.email")}</th>
              <th className="px-4 py-2 text-start">{t("dashboard:team.role")}</th>
              <th className="px-4 py-2 text-start">{t("dashboard:team.status")}</th>
              <th className="px-4 py-2 text-start">{t("dashboard:team.branchAccess")}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-neutral-900">{member.name}</td>
                <td className="px-4 py-2.5 text-neutral-600">{member.email}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={member.role === "OWNER" ? "brand" : "neutral"}>{t(`common:roles.${member.role}`)}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <BrandUserStatusBadge status={member.status} label={t(STATUS_LABEL_KEY[member.status] ?? member.status)} />
                </td>
                <td className="px-4 py-2.5 text-neutral-600">
                  {member.role === "OWNER"
                    ? "—"
                    : member.branchAccess
                        .map((b) => {
                          const branch = branchById.get(b.branchId);
                          return branch ? pick(branch.name, branch.nameAr) : null;
                        })
                        .filter(Boolean)
                        .join(", ")}
                </td>
                <td className="px-4 py-2.5 text-end">
                  {member.role === "MANAGER" && (
                    <button
                      onClick={() => setEditingMember(member)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                      aria-label={t("dashboard:team.editAccess")}
                    >
                      <Settings2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} branches={branches} />
      <EditAccessModal
        key={editingMember?.id}
        open={editingMember !== null}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        branches={branches}
      />
    </div>
  );
}
