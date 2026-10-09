import type { Metadata } from "next";
import { AppHeader } from "@/components/navigation/AppHeader";
import { MobileNavigation } from "@/components/navigation/Navigation";

export const metadata: Metadata = {
  title: {
    default: "Cholo Bondhu",
    template: "%s | Cholo Bondhu",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="flex-1 page-with-bottom-nav">{children}</main>
      <MobileNavigation />
    </div>
  );
}
