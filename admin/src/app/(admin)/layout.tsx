import AdminTopNav from "@/components/AdminTopNav";

/**
 * Layout for all protected admin routes.
 * Renders the top nav above the page content.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AdminTopNav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-4 md:py-8">
        {children}
      </main>
    </div>
  );
}
