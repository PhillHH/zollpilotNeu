import Link from "next/link";

import { AuthForm } from "../components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <h1>Registrieren</h1>
      <AuthForm mode="register" />
      <p className="auth-link">
        Bereits registriert? <Link href="/login">Anmelden</Link>
      </p>
    </main>
  );
}

