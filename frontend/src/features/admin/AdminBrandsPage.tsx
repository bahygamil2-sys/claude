import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminBrands } from "./adminApi";
import { useLocalized } from "@/hooks/useLocalized";
import { Card, CardBody } from "@/components/Card";
import { Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { BrandStatusBadge } from "@/components/Badge";
import { FullPageSpinner } from "@/components/Spinner";
import type { BrandStatus } from "@/types/api";

export default function AdminBrandsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const pick = useLocalized();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BrandStatus | "">("");
  const [page, setPage] = useState(1);

  const brandsQuery = useAdminBrands({ search: search || undefined, status: status || undefined, page, pageSize: 12 });

  if (brandsQuery.isLoading) return <FullPageSpinner />;
  const data = brandsQuery.data;
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-neutral-900">{t("brands.title")}</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t("brands.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as BrandStatus | "");
            setPage(1);
          }}
          className="w-auto"
        >
          <option value="">{t("brands.allStatuses")}</option>
          <option value="ACTIVE">{t("common:brandStatus.ACTIVE")}</option>
          <option value="SUSPENDED">{t("common:brandStatus.SUSPENDED")}</option>
        </Select>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-neutral-500">{t("brands.empty")}</CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((brand) => (
              <Card
                key={brand.id}
                className="cursor-pointer transition hover:border-brand-300"
                onClick={() => navigate(`/admin/brands/${brand.id}`)}
              >
                <CardBody className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-neutral-900">{pick(brand.name, brand.nameAr)}</p>
                    <BrandStatusBadge status={brand.status} label={t(`common:brandStatus.${brand.status}`)} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                    <span>{t("brands.branches", { count: brand._count.branches })}</span>
                    <span>{t("brands.surveys", { count: brand._count.surveys })}</span>
                    <span>{t("brands.users", { count: brand._count.users })}</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("common:pagination.previous")}
              </Button>
              <span className="text-sm text-neutral-500">
                {t("common:pagination.summary", { page: data.page, totalPages: data.totalPages, total: data.total })}
              </span>
              <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("common:pagination.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
