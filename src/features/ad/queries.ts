// 광고 파트너 & 계약 DB 쿼리 (서버 전용).
import { query } from "@/lib/db";
import type {
  AdPartnerRow,
  AdPartnerCategory,
  AdPartnerStatus,
  AdContractRow,
  AdContractWithPartner,
  AdContractStatus,
  AdPlanType,
  ModuleType,
} from "@/lib/types";

// ── 파트너 ──

export async function listPartners(filters?: {
  status?: AdPartnerStatus;
  category?: AdPartnerCategory;
}): Promise<AdPartnerRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters?.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters?.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query<AdPartnerRow>(
    `select * from ad_partners ${where} order by created_at desc`,
    params
  );
}

export async function getPartner(id: string): Promise<AdPartnerRow | null> {
  const rows = await query<AdPartnerRow>(
    `select * from ad_partners where id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createPartner(input: {
  business_name: string;
  category: AdPartnerCategory;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  description?: string;
  address?: string;
  region?: string;
  lat?: number;
  lng?: number;
  place_url?: string;
  photo_url?: string;
}): Promise<AdPartnerRow> {
  const [row] = await query<AdPartnerRow>(
    `insert into ad_partners
       (business_name, category, contact_name, contact_phone, contact_email,
        description, address, region, lat, lng, place_url, photo_url)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning *`,
    [
      input.business_name,
      input.category,
      input.contact_name ?? null,
      input.contact_phone ?? null,
      input.contact_email ?? null,
      input.description ?? null,
      input.address ?? null,
      input.region ?? null,
      input.lat ?? null,
      input.lng ?? null,
      input.place_url ?? null,
      input.photo_url ?? null,
    ]
  );
  return row;
}

export async function updatePartner(
  id: string,
  input: Partial<Omit<AdPartnerRow, "id" | "created_at">>
): Promise<AdPartnerRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const fields = [
    "business_name",
    "category",
    "contact_name",
    "contact_phone",
    "contact_email",
    "description",
    "address",
    "region",
    "lat",
    "lng",
    "place_url",
    "photo_url",
    "status",
  ] as const;
  for (const f of fields) {
    if (f in input) {
      params.push(input[f as keyof typeof input] ?? null);
      sets.push(`${f} = $${params.length}`);
    }
  }
  if (sets.length === 0) return getPartner(id);
  params.push(id);
  const rows = await query<AdPartnerRow>(
    `update ad_partners set ${sets.join(", ")} where id = $${params.length} returning *`,
    params
  );
  return rows[0] ?? null;
}

export async function deletePartner(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `delete from ad_partners where id = $1 returning id`,
    [id]
  );
  return rows.length > 0;
}

// ── 계약 ──

export async function listContracts(filters?: {
  status?: AdContractStatus;
  partner_id?: string;
  module_type?: ModuleType;
}): Promise<AdContractWithPartner[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters?.status) {
    params.push(filters.status);
    conditions.push(`c.status = $${params.length}`);
  }
  if (filters?.partner_id) {
    params.push(filters.partner_id);
    conditions.push(`c.partner_id = $${params.length}`);
  }
  if (filters?.module_type) {
    params.push(filters.module_type);
    conditions.push(`c.module_type = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query<AdContractWithPartner>(
    `select c.*, p.business_name, p.category
     from ad_contracts c
     join ad_partners p on p.id = c.partner_id
     ${where}
     order by c.priority asc, c.created_at desc`,
    params
  );
}

export async function getContract(
  id: string
): Promise<AdContractWithPartner | null> {
  const rows = await query<AdContractWithPartner>(
    `select c.*, p.business_name, p.category
     from ad_contracts c
     join ad_partners p on p.id = c.partner_id
     where c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createContract(input: {
  partner_id: string;
  module_type: ModuleType;
  plan_type: AdPlanType;
  monthly_fee: number;
  start_date: string;
  end_date: string;
  priority?: number;
  memo?: string;
}): Promise<AdContractRow> {
  const [row] = await query<AdContractRow>(
    `insert into ad_contracts
       (partner_id, module_type, plan_type, monthly_fee, start_date, end_date, priority, memo)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [
      input.partner_id,
      input.module_type,
      input.plan_type,
      input.monthly_fee,
      input.start_date,
      input.end_date,
      input.priority ?? 5,
      input.memo ?? null,
    ]
  );
  return row;
}

export async function updateContract(
  id: string,
  input: Partial<Omit<AdContractRow, "id" | "partner_id" | "created_at">>
): Promise<AdContractRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const fields = [
    "module_type",
    "plan_type",
    "monthly_fee",
    "start_date",
    "end_date",
    "priority",
    "status",
    "memo",
  ] as const;
  for (const f of fields) {
    if (f in input) {
      params.push(input[f as keyof typeof input] ?? null);
      sets.push(`${f} = $${params.length}`);
    }
  }
  if (sets.length === 0) return null;
  params.push(id);
  const rows = await query<AdContractRow>(
    `update ad_contracts set ${sets.join(", ")} where id = $${params.length} returning *`,
    params
  );
  return rows[0] ?? null;
}

export async function deleteContract(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `delete from ad_contracts where id = $1 returning id`,
    [id]
  );
  return rows.length > 0;
}

// ── 대시보드 통계 ──

export interface DashboardStats {
  totalPartners: number;
  approvedPartners: number;
  pendingPartners: number;
  activeContracts: number;
  monthlyRevenue: number;
  totalRevenue: number;
  byCategory: { category: string; count: number }[];
  byPlan: { plan_type: string; count: number; revenue: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [partnerStats] = await query<{
    total: string;
    approved: string;
    pending: string;
  }>(
    `select
       count(*)::int as total,
       count(*) filter (where status = 'approved')::int as approved,
       count(*) filter (where status = 'pending')::int as pending
     from ad_partners`
  );

  const [contractStats] = await query<{
    active: string;
    monthly: string;
    total_rev: string;
  }>(
    `select
       count(*) filter (where status = 'active')::int as active,
       coalesce(sum(monthly_fee) filter (where status = 'active'), 0)::int as monthly,
       coalesce(sum(monthly_fee), 0)::int as total_rev
     from ad_contracts`
  );

  const byCategory = await query<{ category: string; count: string }>(
    `select category, count(*)::int as count
     from ad_partners where status = 'approved'
     group by category order by count desc`
  );

  const byPlan = await query<{
    plan_type: string;
    count: string;
    revenue: string;
  }>(
    `select plan_type, count(*)::int as count, coalesce(sum(monthly_fee),0)::int as revenue
     from ad_contracts where status = 'active'
     group by plan_type order by revenue desc`
  );

  return {
    totalPartners: Number(partnerStats.total),
    approvedPartners: Number(partnerStats.approved),
    pendingPartners: Number(partnerStats.pending),
    activeContracts: Number(contractStats.active),
    monthlyRevenue: Number(contractStats.monthly),
    totalRevenue: Number(contractStats.total_rev),
    byCategory: byCategory.map((r) => ({
      category: r.category,
      count: Number(r.count),
    })),
    byPlan: byPlan.map((r) => ({
      plan_type: r.plan_type,
      count: Number(r.count),
      revenue: Number(r.revenue),
    })),
  };
}
