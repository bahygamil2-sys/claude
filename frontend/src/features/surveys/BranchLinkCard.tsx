import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardBody } from "@/components/Card";
import { useLocalized } from "@/hooks/useLocalized";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { useRegenerateLink } from "./linksApi";
import type { SurveyBranchLink } from "@/types/api";

export function BranchLinkCard({ surveyId, link, isOwner }: { surveyId: string; link: SurveyBranchLink; isOwner: boolean }) {
  const { t } = useTranslation(["survey", "common"]);
  const pick = useLocalized();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regenerate = useRegenerateLink();
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  function copyLink() {
    void navigator.clipboard.writeText(link.url);
    toast.success(t("links.copied"));
  }

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${link.branchName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    a.click();
  }

  async function doRegenerate() {
    try {
      await regenerate.mutateAsync({ surveyId, branchId: link.branchId });
      toast.success(t("links.regenerated"));
      setConfirmingRegenerate(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 text-center">
        <p className="font-semibold text-neutral-900">{pick(link.branchName, link.branchNameAr)}</p>
        <div className="rounded-lg border border-neutral-200 p-3">
          <QRCodeCanvas ref={canvasRef} value={link.url} size={160} level="M" marginSize={2} />
        </div>
        <p className="w-full truncate rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500" dir="ltr">
          {link.url}
        </p>
        <div className="flex w-full gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={copyLink}>
            <Copy size={14} className="me-1" />
            {t("common:actions.copy")}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={downloadQr}>
            <Download size={14} className="me-1" />
            {t("links.download")}
          </Button>
        </div>
        {isOwner &&
          (confirmingRegenerate ? (
            <div className="flex w-full flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">{t("links.regenerateWarning")}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" className="flex-1" loading={regenerate.isPending} onClick={() => void doRegenerate()}>
                  {t("common:actions.confirm")}
                </Button>
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => setConfirmingRegenerate(false)}>
                  {t("common:actions.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="w-full text-neutral-500" onClick={() => setConfirmingRegenerate(true)}>
              <RefreshCw size={14} className="me-1" />
              {t("common:actions.regenerate")}
            </Button>
          ))}
      </CardBody>
    </Card>
  );
}
