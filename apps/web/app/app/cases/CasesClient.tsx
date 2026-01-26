"use client";

import { useState } from "react";

import { apiRequest } from "../../lib/api/client";

type CaseItem = {
  id: string;
  title: string;
  status: string;
};

type CasesResponse = {
  data: CaseItem[];
};

type CasesClientProps = {
  initialCases: CaseItem[];
};

export function CasesClient({ initialCases }: CasesClientProps) {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const response = await apiRequest<CasesResponse>("/cases", {
      credentials: "include"
    });
    setCases(response.data);
  };

  const handleCreate = async () => {
    setError(null);
    try {
      await apiRequest("/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({})
      });
      await refresh();
    } catch {
      setError("Unable to create case.");
    }
  };

  return (
    <section>
      <button type="button" onClick={handleCreate}>
        Create case
      </button>
      {error ? <p>{error}</p> : null}
      <ul>
        {cases.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </section>
  );
}

