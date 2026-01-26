export default async function AppPage() {
  return (
    <main>
      <h1>App Dashboard</h1>
      <p>Welcome to ZollPilot App</p>
      <p><a href="/login">Go to Login</a> | <a href="/register">Go to Register</a></p>
      <p style={{ color: "gray", fontSize: "0.9em" }}>
        Note: Auth guards are temporarily disabled. Register/Login to test the full flow.
      </p>
    </main>
  );
}

