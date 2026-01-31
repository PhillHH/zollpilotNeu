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
  // Always use apiFetch - in browser it goes through /api/backend proxy
  // which properly handles Set-Cookie headers
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

// --- Profile Types ---

export type ProfileData = {
  user_id: string;
  email: string;
  name: string | null;
  address: string | null;
  default_sender_name: string | null;
  default_sender_country: string | null;
  default_recipient_name: string | null;
  default_recipient_country: string | null;
  preferred_countries: string[] | null;
  preferred_currencies: string[] | null;
  updated_at: string | null;
};

export type ProfileUpdatePayload = {
  name?: string | null;
  address?: string | null;
  default_sender_name?: string | null;
  default_sender_country?: string | null;
  default_recipient_name?: string | null;
  default_recipient_country?: string | null;
  preferred_countries?: string[] | null;
  preferred_currencies?: string[] | null;
};

type ProfileResponse = { data: ProfileData };

// --- Profile API ---

export const profile = {
  get: (init?: RequestInit) =>
    apiRequest<ProfileResponse>("/profile", {
      credentials: "include",
      ...init
    }),

  update: (data: ProfileUpdatePayload, init?: RequestInit) =>
    apiRequest<ProfileResponse>("/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
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

export type CreditHistoryEntry = {
  id: string;
  delta: number;
  reason: string;
  case_title: string | null;
  created_at: string;
};

type BillingMeResponse = { data: BillingMe };
type CreditHistoryResponse = { data: CreditHistoryEntry[] };

// --- Credit Purchase/Spend Types ---

export type CreditPurchaseResult = {
  balance: number;
  purchased: number;
  price_cents: number;
  currency: string;
};

export type CreditSpendResult = {
  balance: number;
  spent: number;
  case_id: string;
};

export type PricingTier = {
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  description: string;
};

export type PricingInfo = {
  tiers: PricingTier[];
  credit_unit_price_cents: number;
  currency: string;
};

type CreditPurchaseResponse = { data: CreditPurchaseResult };
type CreditSpendResponse = { data: CreditSpendResult };
type PricingInfoResponse = { data: PricingInfo };

// --- Checkout Types ---

export type CheckoutProduct = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  credits: number;
  type: "CREDITS" | "IZA_PASS";
};

export type CheckoutSessionResult = {
  checkout_url: string;
  session_id: string;
  product_id: string;
  amount_cents: number;
  currency: string;
};

export type PurchaseInfo = {
  id: string;
  type: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amount_cents: number;
  currency: string;
  credits_amount: number | null;
  product_name: string | null;
  created_at: string;
  paid_at: string | null;
};

type ProductsListResponse = { data: CheckoutProduct[] };
type CheckoutSessionResponse = { data: CheckoutSessionResult };
type PurchasesListResponse = { data: PurchaseInfo[] };
type PurchaseResponse = { data: PurchaseInfo };
type CompleteCheckoutResponse = { data: { status: string; purchase_id: string; credits_added?: number } };

// --- Billing API ---

export const billing = {
  me: (init?: RequestInit) =>
    apiRequest<BillingMeResponse>("/billing/me", {
      credentials: "include",
      ...init
    }),

  history: (limit?: number, init?: RequestInit) =>
    apiRequest<CreditHistoryResponse>(`/billing/history${limit ? `?limit=${limit}` : ""}`, {
      credentials: "include",
      ...init
    }),

  pricing: (init?: RequestInit) =>
    apiRequest<PricingInfoResponse>("/billing/pricing", {
      credentials: "include",
      ...init
    }),

  purchaseCredits: (amount: number, init?: RequestInit) =>
    apiRequest<CreditPurchaseResponse>("/billing/credits/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount }),
      ...init
    }),

  spendCredits: (caseId: string, init?: RequestInit) =>
    apiRequest<CreditSpendResponse>("/billing/credits/spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ case_id: caseId }),
      ...init
    }),

  // --- Checkout endpoints ---

  products: (init?: RequestInit) =>
    apiRequest<ProductsListResponse>("/billing/products", {
      credentials: "include",
      ...init
    }),

  createCheckoutSession: (productId: string, init?: RequestInit) =>
    apiRequest<CheckoutSessionResponse>("/billing/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ product_id: productId }),
      ...init
    }),

  completeCheckout: (sessionId: string, init?: RequestInit) =>
    apiRequest<CompleteCheckoutResponse>("/billing/checkout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId }),
      ...init
    }),

  purchases: (limit?: number, init?: RequestInit) =>
    apiRequest<PurchasesListResponse>(`/billing/purchases${limit ? `?limit=${limit}` : ""}`, {
      credentials: "include",
      ...init
    }),

  purchase: (purchaseId: string, init?: RequestInit) =>
    apiRequest<PurchaseResponse>(`/billing/purchases/${purchaseId}`, {
      credentials: "include",
      ...init
    }),
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

export type ProcedureCode = "IZA" | "IAA" | "IPK";

export type Plan = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  interval: string;
  price_cents: number | null;
  currency: string;
  credits_included: number;
  allowed_procedures: ProcedureCode[];
  created_at: string;
  updated_at: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  plan_code: string | null;
  credits_balance: number;
  user_count: number;
  created_at: string;
};

// --- Admin User Types ---

export type UserSummary = {
  id: string;
  email: string;
  user_type: "PRIVATE" | "BUSINESS";
  status: "ACTIVE" | "DISABLED";
  tenant_id: string | null;
  tenant_name: string | null;
  created_at: string;
  last_login_at: string | null;
};

export type LedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  metadata_json: unknown;
  created_by_user_id: string | null;
  created_at: string;
};

export type UserEvent = {
  id: string;
  type: string;
  created_at: string;
  metadata_json: unknown;
};

export type UserDetail = {
  id: string;
  email: string;
  user_type: "PRIVATE" | "BUSINESS";
  status: "ACTIVE" | "DISABLED";
  tenant_id: string | null;
  tenant_name: string | null;
  created_at: string;
  last_login_at: string | null;
  events: UserEvent[];
};

export type TenantDetail = {
  id: string;
  name: string;
  type: string;
  plan_code: string | null;
  credits_balance: number;
  user_count: number;
  created_at: string;
  users: UserSummary[];
};

export type EventListItem = {
  id: string;
  user_id: string;
  user_email: string;
  tenant_id: string | null;
  tenant_name: string | null;
  type: string;
  created_at: string;
  metadata_json: unknown;
};

export type EventListParams = {
  user_id?: string;
  tenant_id?: string;
  event_type?: string;
  page?: number;
  page_size?: number;
};

type PlanListResponse = { data: Plan[] };
type PlanSingleResponse = { data: Plan };
type TenantListResponse = { data: TenantSummary[] };
type TenantDetailResponse = { data: TenantDetail };
type UserListResponse = { data: UserSummary[] };
type UserDetailResponse = { data: UserDetail };
type EventListResponse = { data: EventListItem[]; total: number; page: number; page_size: number };
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
      data: {
        code: string;
        name: string;
        interval?: string;
        price_cents?: number;
        credits_included?: number;
        allowed_procedures?: ProcedureCode[];
      },
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
      data: {
        name?: string;
        price_cents?: number;
        interval?: string;
        credits_included?: number;
        allowed_procedures?: ProcedureCode[];
      },
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

    get: (tenantId: string, init?: RequestInit) =>
      apiRequest<TenantDetailResponse>(`/admin/tenants/${tenantId}`, {
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
  },

  users: {
    list: (init?: RequestInit) =>
      apiRequest<UserListResponse>("/admin/users", {
        credentials: "include",
        ...init
      }),

    get: (userId: string, init?: RequestInit) =>
      apiRequest<UserDetailResponse>(`/admin/users/${userId}`, {
        credentials: "include",
        ...init
      })
  },

  events: {
    list: (params: EventListParams = {}, init?: RequestInit) => {
      const searchParams = new URLSearchParams();
      if (params.user_id) searchParams.set("user_id", params.user_id);
      if (params.tenant_id) searchParams.set("tenant_id", params.tenant_id);
      if (params.event_type) searchParams.set("event_type", params.event_type);
      if (params.page) searchParams.set("page", String(params.page));
      if (params.page_size) searchParams.set("page_size", String(params.page_size));
      const query = searchParams.toString();
      return apiRequest<EventListResponse>(`/admin/events${query ? `?${query}` : ""}`, {
        credentials: "include",
        ...init
      });
    }
  }
};

// --- Content Types (Public Blog & FAQ) ---

export type BlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

export type BlogPostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

export type FaqEntryItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  related_blog_slug: string | null;
};

export type FaqCategory = {
  category: string;
  entries: FaqEntryItem[];
};

type BlogListResponse = { data: BlogPostListItem[] };
type BlogDetailResponse = { data: BlogPostDetail };
type FaqListResponse = { data: FaqCategory[] };

// --- Content API (Public, no auth required) ---

export const content = {
  listBlogPosts: (init?: RequestInit) =>
    apiRequest<BlogListResponse>("/content/blog", init),

  getBlogPost: (slug: string, init?: RequestInit) =>
    apiRequest<BlogDetailResponse>(`/content/blog/${slug}`, init),

  listFaq: (init?: RequestInit) =>
    apiRequest<FaqListResponse>("/content/faq", init)
};

// --- Admin Content Types ---

export type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
};

export type AdminBlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminFaqEntry = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  related_blog_post_id: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
};

export type AdminFaqListItem = {
  id: string;
  question: string;
  category: string;
  order_index: number;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostCreatePayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status?: "DRAFT" | "PUBLISHED";
  meta_title?: string;
  meta_description?: string;
};

export type BlogPostUpdatePayload = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  status?: "DRAFT" | "PUBLISHED";
  meta_title?: string;
  meta_description?: string;
};

export type FaqCreatePayload = {
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
  status?: "DRAFT" | "PUBLISHED";
  related_blog_post_id?: string;
};

export type FaqUpdatePayload = {
  question?: string;
  answer?: string;
  category?: string;
  order_index?: number;
  status?: "DRAFT" | "PUBLISHED";
  related_blog_post_id?: string;
};

type AdminBlogListResponse = { data: AdminBlogPostListItem[]; total: number };
type AdminBlogDetailResponse = { data: AdminBlogPost };
type AdminFaqListResponse = { data: AdminFaqListItem[]; total: number };
type AdminFaqDetailResponse = { data: AdminFaqEntry };
type CategoriesResponse = { data: string[] };

// --- Admin Content API ---

// --- Prefill Types ---

export type FieldSuggestion = {
  field_key: string;
  value: unknown;
  confidence: number;
  source: string;
  display_label: string;
};

export type ItemSuggestion = {
  name: string;
  price: number | null;
  currency: string | null;
  confidence: number;
};

export type PrefillSuggestions = {
  suggestions: FieldSuggestion[];
  items: ItemSuggestion[];
  raw_text_preview: string | null;
  extraction_method: string;
  warnings: string[];
};

export type PrefillInfo = {
  supported_formats: string[];
  max_file_size_mb: number;
  features: string[];
  limitations: string[];
  privacy: {
    storage: string;
    external_services: string;
    training: string;
    logging: string;
  };
};

type PrefillUploadResponse = { data: PrefillSuggestions };
type PrefillInfoResponse = { data: PrefillInfo };

// --- Prefill API ---

export const prefill = {
  /**
   * Upload an invoice/receipt and extract field suggestions.
   * Accepts PDF, JPG, PNG (max 10 MB).
   */
  upload: async (file: File): Promise<PrefillSuggestions> => {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/prefill/upload`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Contract-Version": "1",
      },
      body: formData,
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
        message: error.message ?? "Upload failed.",
        details: error.details,
        requestId: errorPayload?.requestId ?? response.headers.get("X-Request-Id"),
        status: response.status
      } satisfies ApiError;
    }

    const result = await response.json() as PrefillUploadResponse;
    return result.data;
  },

  /**
   * Get information about the prefill feature.
   */
  info: (init?: RequestInit) =>
    apiRequest<PrefillInfoResponse>("/prefill/info", {
      credentials: "include",
      ...init
    }),
};

export const adminContent = {
  blog: {
    list: (status?: "DRAFT" | "PUBLISHED", init?: RequestInit) =>
      apiRequest<AdminBlogListResponse>(
        `/admin/content/blog${status ? `?status=${status}` : ""}`,
        { credentials: "include", ...init }
      ),

    get: (id: string, init?: RequestInit) =>
      apiRequest<AdminBlogDetailResponse>(`/admin/content/blog/${id}`, {
        credentials: "include",
        ...init
      }),

    create: (data: BlogPostCreatePayload, init?: RequestInit) =>
      apiRequest<AdminBlogDetailResponse>("/admin/content/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
        ...init
      }),

    update: (id: string, data: BlogPostUpdatePayload, init?: RequestInit) =>
      apiRequest<AdminBlogDetailResponse>(`/admin/content/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
        ...init
      }),

    delete: (id: string, init?: RequestInit) =>
      apiRequest<void>(`/admin/content/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
        ...init
      })
  },

  faq: {
    list: (status?: "DRAFT" | "PUBLISHED", category?: string, init?: RequestInit) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      const query = params.toString();
      return apiRequest<AdminFaqListResponse>(
        `/admin/content/faq${query ? `?${query}` : ""}`,
        { credentials: "include", ...init }
      );
    },

    get: (id: string, init?: RequestInit) =>
      apiRequest<AdminFaqDetailResponse>(`/admin/content/faq/${id}`, {
        credentials: "include",
        ...init
      }),

    create: (data: FaqCreatePayload, init?: RequestInit) =>
      apiRequest<AdminFaqDetailResponse>("/admin/content/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
        ...init
      }),

    update: (id: string, data: FaqUpdatePayload, init?: RequestInit) =>
      apiRequest<AdminFaqDetailResponse>(`/admin/content/faq/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
        ...init
      }),

    delete: (id: string, init?: RequestInit) =>
      apiRequest<void>(`/admin/content/faq/${id}`, {
        method: "DELETE",
        credentials: "include",
        ...init
      }),

    categories: (init?: RequestInit) =>
      apiRequest<CategoriesResponse>("/admin/content/categories", {
        credentials: "include",
        ...init
      })
  }
};

