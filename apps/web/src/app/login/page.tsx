import Link from "next/link";

import { AuthForm } from "../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <h1>Anmelden</h1>
      <AuthForm mode="login" />
      <p className="auth-link">
        Noch kein Konto? <Link href="/register">Registrieren</Link>
      </p>
    </main>
  );
}

