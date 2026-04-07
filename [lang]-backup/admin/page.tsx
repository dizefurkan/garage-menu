import PublishButton from "@/components/PublishButton";

export const runtime = "nodejs";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f2f0e9] px-4 py-16 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[#890333]/70">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#890333]">
            Publish Menu
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Use this action to make the latest Google Drive content visible
            after you review it.
          </p>
        </div>

        <PublishButton />
      </div>
    </main>
  );
}
