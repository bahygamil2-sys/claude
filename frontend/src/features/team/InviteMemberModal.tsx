import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useInviteTeamMember } from "./teamApi";
import { useLocalized } from "@/hooks/useLocalized";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";
import type { RestaurantBranch } from "@/types/api";

export function InviteMemberModal({ open, onClose, branches }: { open: boolean; onClose: () => void; branches: RestaurantBranch[] }) {
  const { t } = useTranslation(["dashboard", "common"]);
  const pick = useLocalized();
  const inviteMember = useInviteTeamMember();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  function toggleBranch(id: string) {
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  function reset() {
    setName("");
    setEmail("");
    setBranchIds([]);
    setInviteToken(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (branchIds.length === 0) {
      toast.error(t("dashboard:team.noBranchesSelected"));
      return;
    }
    setSaving(true);
    try {
      const member = await inviteMember.mutateAsync({ name, email, branchIds });
      setInviteToken(member.inviteToken);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inviteUrl = inviteToken ? `${window.location.origin}/accept-invite/${inviteToken}` : "";

  function copyLink() {
    void navigator.clipboard.writeText(inviteUrl);
    toast.success(t("common:actions.copy"));
  }

  return (
    <Modal open={open} onClose={close} title={t("dashboard:team.inviteManager")}>
      {inviteToken ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600">{t("dashboard:team.inviteSent")}</p>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-600" dir="ltr">
              {inviteUrl}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={copyLink} aria-label={t("common:actions.copy")}>
              <Copy size={14} />
            </Button>
          </div>
          <Button type="button" onClick={close}>
            {t("common:actions.close")}
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input label={t("dashboard:team.name")} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" label={t("dashboard:team.email")} required value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <Button type="submit" loading={saving} fullWidth>
            {t("dashboard:team.inviteManager")}
          </Button>
        </form>
      )}
    </Modal>
  );
}
