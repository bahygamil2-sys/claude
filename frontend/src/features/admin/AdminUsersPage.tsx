import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminUsers, useUpdateUserStatus } from "./adminApi";
import { FilterBar } from "@/components/FilterBar";
import { Input, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/Badge";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Role } from "@/types/api";

const ROLES: Role[] = ["CUSTOMER", "RESTAURANT_OWNER", "ADMIN"];

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const [role, setRole] = useState<Role | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const users = useAdminUsers({ role: role || undefined, search: search || undefined, page, pageSize: 20 });
  const updateStatus = useUpdateUserStatus();

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateStatus.mutateAsync({ id, isActive: !isActive });
      toast.success(!isActive ? t("users.activated") : t("users.suspended"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-neutral-900">{t("users.title")}</h1>

      <FilterBar>
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder={t("common:actions.search")}
          className="w-48"
        />
        <Select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as Role | "");
          }}
          className="w-auto"
        >
          <option value="">{t("users.allRoles")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`common:roles.${r}`)}
            </option>
          ))}
        </Select>
      </FilterBar>

      {users.isLoading ? (
        <Spinner />
      ) : users.data && users.data.items.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                  <th className="p-3 text-start font-medium">{t("users.name")}</th>
                  <th className="p-3 text-start font-medium">{t("users.email")}</th>
                  <th className="p-3 text-start font-medium">{t("users.role")}</th>
                  <th className="p-3 text-start font-medium">{t("users.joined")}</th>
                  <th className="p-3 text-start font-medium">{t("users.status")}</th>
                  <th className="p-3 text-end font-medium" />
                </tr>
              </thead>
              <tbody>
                {users.data.items.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="p-3 font-medium text-neutral-800">{u.name}</td>
                    <td className="p-3 text-neutral-600">{u.email}</td>
                    <td className="p-3">
                      <Badge tone={u.role === "ADMIN" ? "brand" : u.role === "RESTAURANT_OWNER" ? "info" : "neutral"}>{t(`common:roles.${u.role}`)}</Badge>
                    </td>
                    <td className="p-3 text-xs text-neutral-500">{new Date(u.createdAt).toLocaleDateString(i18n.language)}</td>
                    <td className="p-3">
                      <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? t("users.active") : t("users.inactive")}</Badge>
                    </td>
                    <td className="p-3 text-end">
                      {u.role !== "ADMIN" && (
                        <Button size="sm" variant="outline" loading={updateStatus.isPending} onClick={() => toggleActive(u.id, u.isActive)}>
                          {u.isActive ? t("common:actions.suspend") : t("common:actions.reactivate")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={users.data.page} totalPages={users.data.totalPages} total={users.data.total} onChange={setPage} />
        </div>
      ) : (
        <p className="py-16 text-center text-neutral-400">{t("common:state.empty")}</p>
      )}
    </div>
  );
}
