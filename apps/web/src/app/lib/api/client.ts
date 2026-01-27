import { backendBinary, backendJson, type BackendRequestInit } from "../actions/backend";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string | null;
  status: number;
};

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/backend";
  }

  return process.env.API_BASE_URL ?? "http://localhost:8000";
}

function toBackendInit(init: RequestInit = {}): BackendRequestInit {
  const headers = new Headers(init.headers);
  const body = typeof init.body === "string" ? init.body : undefined;

  return {
    method: init.method,
    headers: Object.fromEntries(headers.entries()),
    body
  };
}

async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const headers = new Headers(init.headers);
  headers.set("X-Contract-Version", "1");

  return fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: init.credentials ?? "include",
    headers
  });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (typeof window !== "undefined") {
    const result = await backendJson(path, toBackendInit(init));
    if (!result.ok) {
      let payload: unknown = null;
      try {
        payload = JSON.parse(result.body);
      } catch {
        payload = null;
      }

      const errorPayload = payload as { error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null;
      const error = errorPayload?.error ?? {};
      throw {
        code: error.code ?? "UNKNOWN_ERROR",
        message: error.message ?? "Request failed.",
        details: error.details,
        requestId: errorPayload?.requestId ?? result.requestId,
        status: result.status
      } satisfies ApiError;
    }

    return JSON.parse(result.body) as T;
  }

  const response = await apiFetch(path, init);

  const requestId = response.headers.get("X-Request-Id");

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const errorPayload = payload as { error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null;
    const error = errorPayload?.error ?? {};
    throw {
      code: error.code ?? "UNKNOWN_ERROR",
      message: error.message ?? "Request failed.",
      details: error.details,
      requestId: errorPayload?.requestId ?? requestId,
      status: response.status
    } satisfies ApiError;
  }

  return (await response.json()) as T;
}

// --- Types ---

export type CaseSummary = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CaseField = {
  key: string;
  value: unknown;
  updated_at: string;
};

export type CaseDetail = CaseSummary & {
  version: number;
  submitted_at: string | null;
  archived_at: string | null;
  procedure: { code: string; name: string } | null;
  fields: CaseField[];
};

export type SubmitResult = {
  status: string;
  version: number;
  snapshot_id: string;
};

export type SnapshotSummary = {
  id: string;
  version: number;
  created_at: string;
};

export type SnapshotDetail = {
  id: string;
  case_id: string;
  version: number;
  procedure_code: string;
  procedure_version: string;
  fields_json: Record<string, unknown>;
  validation_json: { valid: boolean; errors: unknown[] };
  created_at: string;
};

type SubmitResponse = { data: SubmitResult };
type SnapshotListResponse = { data: SnapshotSummary[] };
type SnapshotDetailResponse = { data: SnapshotDetail };

// Summary types
export type SummaryItem = {
  label: string;
  value: string;
};

export type SummarySection = {
  title: string;
  items: SummaryItem[];
};

export type CaseSummaryOutput = {
  procedure: {
    code: string;
    version: string;
    name: string;
  };
  sections: SummarySection[];
};

type CaseSummaryOutputResponse = { data: CaseSummaryOutput };

type CaseSummaryResponse = { data: CaseSummary };
type CaseListResponse = { data: CaseSummary[] };
type CaseDetailResponse = { data: CaseDetail };
type FieldResponse = { data: CaseField };
type FieldListResponse = { data: CaseField[] };

// --- Cases API ---

export const cases = {
  list: (status: "active" | "archived" | "all" = "active", init?: RequestInit) =>
    apiRequest<CaseListResponse>(`/cases?status=${status}`, {
      credentials: "include",
      ...init
    }),

  create: (title?: string, init?: RequestInit) =>
    apiRequest<CaseSummaryResponse>("/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title }),
      ...init
    }),

  get: (id: string, init?: RequestInit) =>
    apiRequest<CaseDetailResponse>(`/cases/${id}`, {
      credentials: "include",
      ...init
    }),

  patch: (id: string, data: { title?: string }, init?: RequestInit) =>
    apiRequest<CaseSummaryResponse>(`/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
      ...init
    }),

  archive: (id: string, init?: RequestInit) =>
    apiRequest<CaseSummaryResponse>(`/cases/${id}/archive`, {
      method: "POST",
      credentials: "include",
      ...init
    }),

  submit: (id: string, init?: RequestInit) =>
    apiRequest<SubmitResponse>(`/cases/${id}/submit`, {
      method: "POST",
      credentials: "include",
      ...init
    }),

  listSnapshots: (id: string, init?: RequestInit) =>
    apiRequest<SnapshotListResponse>(`/cases/${id}/snapshots`, {
      credentials: "include",
      ...init
    }),

  getSnapshot: (id: string, version: number, init?: RequestInit) =>
    apiRequest<SnapshotDetailResponse>(`/cases/${id}/snapshots/${version}`, {
      credentials: "include",
      ...init
    }),

  getSummary: (id: string, init?: RequestInit) =>
    apiRequest<CaseSummaryOutputResponse>(`/cases/${id}/summary`, {
      credentials: "include",
      ...init
    }),

  /**
   * Export case as PDF.
   * Returns Blob for download.
   * Requires SUBMITTED status and 1 credit.
   */
  exportPdf: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    if (typeof window !== "undefined") {
      const result = await backendBinary(`/cases/${id}/pdf`, {
        method: "POST"
      });

      if (!result.ok) {
        let payload: unknown = null;
        try {
          payload = JSON.parse(atob(result.bodyBase64));
        } catch {
          payload = null;
        }

        const errorPayload = payload as { error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null;
        const error = errorPayload?.error ?? {};
        throw {
          code: error.code ?? "UNKNOWN_ERROR",
          message: error.message ?? "PDF export failed.",
          details: error.details,
          requestId: errorPayload?.requestId ?? result.requestId,
          status: result.status
        } satisfies ApiError;
      }

      const bytes = Uint8Array.from(atob(result.bodyBase64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: result.contentType ?? "application/pdf"
      });
      let filename = "ZollPilot_Export.pdf";

      if (result.contentDisposition) {
        const match = result.contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      return { blob, filename };
    }

    const response = await apiFetch(`/cases/${id}/pdf`, {
      method: "POST"
    });

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const errorPayload = payload as { error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null;
      const error = errorPayload?.error ?? {};
      throw {
        code: error.code ?? "UNKNOWN_ERROR",
        message: error.message ?? "PDF export failed.",
        details: error.details,
        requestId: errorPayload?.requestId ?? response.headers.get("X-Request-Id"),
        status: response.status
      } satisfies ApiError;
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "ZollPilot_Export.pdf";

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }

    return { blob, filename };
  }
};

// --- Fields API ---

export const fields = {
  getAll: (caseId: string, init?: RequestInit) =>
    apiRequest<FieldListResponse>(`/cases/${caseId}/fields`, {
      credentials: "include",
      ...init
    }),

  upsert: (caseId: string, key: string, value: unknown, init?: RequestInit) =>
    apiRequest<FieldResponse>(`/cases/${caseId}/fields/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
      ...init
    })
};

// --- Billing Types ---

export type PlanInfo = {
  code: string;
  name: string;
  interval: string;
  price_cents: number | null;
  currency: string | null;
};

export type TenantInfo = {
  id: string;
  name: string;
};

export type CreditsInfo = {
  balance: number;
};

export type BillingMe = {
  tenant: TenantInfo;
  plan: PlanInfo | null;
  credits: CreditsInfo;
};

type BillingMeResponse = { data: BillingMe };

// --- Billing API ---

export const billing = {
  me: (init?: RequestInit) =>
    apiRequest<BillingMeResponse>("/billing/me", {
      credentials: "include",
      ...init
    })
};

// --- Procedures Types ---

export type FieldConfig = {
  maxLength?: number;
  placeholder?: string;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  label?: string;
  title?: string;
  description?: string;
  default?: string;
};

export type ProcedureField = {
  field_key: string;
  field_type: "TEXT" | "NUMBER" | "SELECT" | "COUNTRY" | "CURRENCY" | "BOOLEAN";
  required: boolean;
  config: FieldConfig | null;
  order: number;
};

export type ProcedureStep = {
  step_key: string;
  title: string;
  order: number;
  fields: ProcedureField[];
};

export type ProcedureSummary = {
  code: string;
  name: string;
  version: string;
};

export type ProcedureDefinition = {
  id: string;
  code: string;
  name: string;
  version: string;
  is_active: boolean;
  steps: ProcedureStep[];
};

export type ValidationError = {
  step_key: string;
  field_key: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[] | null;
};

export type BindProcedureResult = {
  case_id: string;
  procedure_code: string;
  procedure_version: string;
};

type ProcedureListResponse = { data: ProcedureSummary[] };
type ProcedureDetailResponse = { data: ProcedureDefinition };
type BindProcedureResponse = { data: BindProcedureResult };
type ValidationResponse = { data: ValidationResult };

// --- Procedures API ---

export const procedures = {
  list: (init?: RequestInit) =>
    apiRequest<ProcedureListResponse>("/procedures", {
      credentials: "include",
      ...init
    }),

  get: (code: string, init?: RequestInit) =>
    apiRequest<ProcedureDetailResponse>(`/procedures/${code}`, {
      credentials: "include",
      ...init
    }),

  bind: (caseId: string, procedureCode: string, init?: RequestInit) =>
    apiRequest<BindProcedureResponse>(`/cases/${caseId}/procedure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ procedure_code: procedureCode }),
      ...init
    }),

  validate: (caseId: string, init?: RequestInit) =>
    apiRequest<ValidationResponse>(`/cases/${caseId}/validate`, {
      method: "POST",
      credentials: "include",
      ...init
    })
};

// --- Admin Types ---

export type Plan = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  interval: string;
  price_cents: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  plan_code: string | null;
  credits_balance: number;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  metadata_json: unknown;
  created_by_user_id: string | null;
  created_at: string;
};

type PlanListResponse = { data: Plan[] };
type PlanSingleResponse = { data: Plan };
type TenantListResponse = { data: TenantSummary[] };
type LedgerListResponse = { data: LedgerEntry[] };
type CreditsBalanceResponse = { data: { balance: number } };

// --- Admin API ---

export const admin = {
  plans: {
    list: (init?: RequestInit) =>
      apiRequest<PlanListResponse>("/admin/plans", {
        credentials: "include",
        ...init
      }),

    create: (
      data: { code: string; name: string; interval?: string; price_cents?: number },
      init?: RequestInit
    ) =>
      apiRequest<PlanSingleResponse>("/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
        ...init
      }),

    patch: (
      id: string,
      data: { name?: string; price_cents?: number; interval?: string },
      init?: RequestInit
    ) =>
      apiRequest<PlanSingleResponse>(`/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
        ...init
      }),

    activate: (id: string, init?: RequestInit) =>
      apiRequest<PlanSingleResponse>(`/admin/plans/${id}/activate`, {
        method: "POST",
        credentials: "include",
        ...init
      }),

    deactivate: (id: string, init?: RequestInit) =>
      apiRequest<PlanSingleResponse>(`/admin/plans/${id}/deactivate`, {
        method: "POST",
        credentials: "include",
        ...init
      })
  },

  tenants: {
    list: (init?: RequestInit) =>
      apiRequest<TenantListResponse>("/admin/tenants", {
        credentials: "include",
        ...init
      }),

    setPlan: (tenantId: string, planCode: string, init?: RequestInit) =>
      apiRequest<{ data: TenantSummary }>(`/admin/tenants/${tenantId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan_code: planCode }),
        ...init
      }),

    grantCredits: (
      tenantId: string,
      amount: number,
      note?: string,
      init?: RequestInit
    ) =>
      apiRequest<CreditsBalanceResponse>(`/admin/tenants/${tenantId}/credits/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, note }),
        ...init
      }),

    ledger: (tenantId: string, init?: RequestInit) =>
      apiRequest<LedgerListResponse>(`/admin/tenants/${tenantId}/credits/ledger`, {
        credentials: "include",
        ...init
      })
  }
};

