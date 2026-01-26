type LandingProps = {
  health: string | null;
};

export function Landing({ health }: LandingProps) {
  return (
    <main>
      <h1>ZollPilot</h1>
      <p>Minimal foundation for the platform.</p>
      <p>API health: {health ?? "unknown"}</p>
    </main>
  );
}

