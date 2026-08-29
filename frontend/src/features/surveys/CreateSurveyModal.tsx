import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useCreateSurvey } from "./surveysApi";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";

export function CreateSurveyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("survey");
  const navigate = useNavigate();
  const createSurvey = useCreateSurvey();

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [saving, setSaving] = useState(false);

  function close() {
    setTitle("");
    setTitleAr("");
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const survey = await createSurvey.mutateAsync({ title, titleAr });
      close();
      navigate(`/surveys/${survey.id}/edit`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={t("create.title")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input label={t("create.titleField")} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label={t("create.titleFieldAr")} required value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        <Button type="submit" loading={saving} fullWidth>
          {t("create.submit")}
        </Button>
      </form>
    </Modal>
  );
}
