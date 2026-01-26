import { AuthForm } from "../components/AuthForm";

export default function LoginPage() {
  console.log("!!! RENDERING LOGIN PAGE !!!");
  return (
    <main>
      <h1>Login</h1>
      <AuthForm mode="login" />
    </main>
  );
}

