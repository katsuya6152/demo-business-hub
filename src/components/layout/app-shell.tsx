import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileBottomNav } from "./mobile-bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto px-4 pb-20 pt-6 md:px-6 md:pt-8 lg:px-8 lg:pb-8 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
