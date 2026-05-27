import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarWrapper } from "./SidebarWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>
      <SidebarWrapper
        firstName={user.firstName}
        lastName={user.lastName}
        email={user.emailAddresses[0]?.emailAddress}
      />
      <main style={{ marginLeft: 240, flex: 1, padding: 32, color: "white" }}>
        {children}
      </main>
    </div>
  );
}