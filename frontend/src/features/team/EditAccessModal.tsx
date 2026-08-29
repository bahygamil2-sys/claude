import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { useUpdateTeamMember } from "./teamApi";
import type { TeamMember } from "./teamApi";
import { useLocalized } from "@/hooks/useLocalized";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";
import type { RestaurantBranch } from "@/types/api";

// Keyed by member.id in the parent so this instance always remounts fresh —
// otherwise its branchIds state would carry over from whichever member was
// edited previously.
export function EditAccessModal({
  open,
  onClose,
  member,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  branches: RestaurantBranch[];
}) {
  const { t } = useTranslation(["dashboard", "common"]);
  const pick = useLocalized();
  const updateMember = useUpdateTeamMember();
  const [branchIds, setBranchIds] = useState<string[]>(member?.branchAccess.map((b) => b.branchId) ?? []);
  const [saving, setSaving] = useState(false);

  function toggleBranch(id: string) {
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  async function save() {
    if (!member) return;
    if (branchIds.length === 0) {
      toast.error(t("dashboard:team.noBranchesSelected"));
      return;
    }
    setSaving(true);
    try {
      await updateMember.mutateAsync({ id: member.id, input: { branchIds } });
      toast.success(t("dashboard:team.accessUpdated"));
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!member) return;
    setSaving(true);
    try {
      await updateMember.mutateAsync({ id: member.id, input: { status: member.status === "DISABLED" ? "ACTIVE" : "DISABLED" } });
      toast.success(t("dashboard:team.accessUpdated"));
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose} title={t("dashboard:team.editAccess")}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700">{t("dashboard:team.selectBranches")}</span>
          <div className="flex flex-wrap gap-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => toggleBranch(branch.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  branchIds.includes(branch.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"
                }`}
              >
                {pick(branch.name, branch.nameAr)}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" loading={saving} onClick={() => void save()}>
          {t("common:actions.save")}
        </Button>
        {member.status !== "INVITED" && (
          <Button
            type="button"
            variant={member.status === "DISABLED" ? "outline" : "danger"}
            loading={saving}
            onClick={() => void toggleStatus()}
          >
            {member.status === "DISABLED" ? t("dashboard:team.reactivate") : t("dashboard:team.disable")}
          </Button>
        )}
      </div>
    </Modal>
  );
}
