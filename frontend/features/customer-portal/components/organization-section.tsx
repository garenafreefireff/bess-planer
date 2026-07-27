"use client";

import { Building2, CheckCircle2, LoaderCircle, RefreshCw, Save, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  organizationApi,
  readOrganizationApiError,
  type OrganizationResponse
} from "../api/organization.api";

type OrganizationDraft = {
  name: string;
  industry: string;
  phone: string;
  address: string;
};

const emptyDraft: OrganizationDraft = {
  name: "",
  industry: "",
  phone: "",
  address: ""
};

export function OrganizationSection() {
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null);
  const [draft, setDraft] = useState<OrganizationDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const value = await organizationApi.getCurrent();
      setOrganization(value);
      setDraft(toDraft(value));
    } catch (loadError) {
      setError(readOrganizationApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft.name.trim()) {
      setError("Tên tổ chức là bắt buộc.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const updated = await organizationApi.updateCurrent({
        name: draft.name.trim(),
        industry: draft.industry.trim() || null,
        phone: draft.phone.trim() || null,
        address: draft.address.trim() || null
      });
      setOrganization(updated);
      setDraft(toDraft(updated));
      setSaved(true);
    } catch (saveError) {
      setError(readOrganizationApiError(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !organization) {
    return <Card className="grid min-h-[320px] place-items-center rounded-xl bg-white shadow-panel"><LoaderCircle className="animate-spin text-brand-blue" size={38} /></Card>;
  }

  return (
    <div className="grid max-w-5xl gap-4">
      <Card className="rounded-xl bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-brand-blue"><Building2 size={25} /></span>
            <div>
              <h2 className="text-xl font-bold text-brand-navy">Thông tin organization</h2>
              <p className="mt-1 text-sm font-medium text-brand-muted">Account dùng chung để quản lý khách hàng, thành viên, dự án và quyền truy cập các ứng dụng DataInsight.</p>
            </div>
          </div>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}><RefreshCw className={loading ? "animate-spin" : ""} size={16} />Làm mới</Button>
        </div>

        {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
        {saved ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-brand-green"><CheckCircle2 size={17} />Đã lưu thông tin tổ chức.</div> : null}

        <div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Field label="Tên tổ chức" required value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
          <Field label="Ngành hoạt động" value={draft.industry} onChange={(industry) => setDraft({ ...draft, industry })} />
          <Field label="Số điện thoại" value={draft.phone} onChange={(phone) => setDraft({ ...draft, phone })} />
          <Field label="Địa chỉ" value={draft.address} onChange={(address) => setDraft({ ...draft, address })} />
        </div>

        <div className="mt-5 flex justify-end">
          <Button disabled={saving} onClick={() => void save()}>{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{saving ? "Đang lưu..." : "Lưu organization"}</Button>
        </div>
      </Card>

      <Card className="rounded-xl bg-white p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-brand-green"><Users size={21} /></span>
          <div><h2 className="font-bold text-brand-navy">Thành viên organization</h2><p className="text-xs font-medium text-brand-muted">{organization?.member_user_ids.length ?? 0} tài khoản đã liên kết.</p></div>
        </div>
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-brand-muted">
          Mời thành viên và phân quyền theo ứng dụng sẽ được quản lý trên cùng organization. Chủ sở hữu hiện tại: <strong className="text-brand-navy">{organization?.owner_user_id || "—"}</strong>.
        </div>
      </Card>
    </div>
  );
}

function Field({ label, required = false, value, onChange }: { label: string; required?: boolean; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label}{required ? <span className="text-red-500"> *</span> : null}<Input className="h-11" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function toDraft(value: OrganizationResponse): OrganizationDraft {
  return {
    name: value.name,
    industry: value.industry ?? "",
    phone: value.phone ?? "",
    address: value.address ?? ""
  };
}
