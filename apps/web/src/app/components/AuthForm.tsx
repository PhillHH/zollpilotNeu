"use client";

import { useState } from "react";

import { apiRequest, type ApiError } from "../lib/api/client";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    // Demo: Add admin flag for register
    if (mode === "register") {
      payload.demo_admin = formData.get("demo_admin") === "on";
    }

    try {
      await apiRequest(`/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      window.location.href = "/app";
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "EMAIL_IN_USE") {
        setError("Diese E-Mail ist bereits registriert.");
      } else if (apiErr.code === "INVALID_CREDENTIALS") {
        setError("E-Mail oder Passwort falsch.");
      } else {
        setError(apiErr.message ?? "Ein Fehler ist aufgetreten.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        E-Mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Passwort
        <input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {mode === "register" && (
        <label className="checkbox-label">
          <input name="demo_admin" type="checkbox" />
          Als Admin registrieren (Demo)
        </label>
      )}
      <button type="submit" disabled={loading}>
        {loading ? "..." : mode === "login" ? "Anmelden" : "Registrieren"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  );
}

