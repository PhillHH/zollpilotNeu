import { AuthForm } from "../components/AuthForm";

export default function LoginPage() {
  return (
    <main>
      <h1>Login</h1>
      <AuthForm mode="login" />
    </main>
  );
}

