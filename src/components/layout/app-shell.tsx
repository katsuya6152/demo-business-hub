import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
