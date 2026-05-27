import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <SignUp />
    </main>
  );
}
