"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke("setup-admin", {
      body: { email, password, setup_secret: setupSecret },
    });

    if (fnError || !data?.success) {
      setError(data?.error || "Failed to create admin account");
      setLoading(false);
      return;
    }

    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSetup} className="w-full max-w-sm bg-white p-6 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-navy mb-1">Create Admin Account</h1>
        <p className="text-xs text-gray-500 mb-6">This works only once — before any admin exists.</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Setup Secret</label>
            <input
              value={setupSecret}
              onChange={(e) => setSetupSecret(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="SETUP_ADMIN_SECRET env value"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password (min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 bg-cta text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>
    </div>
  );
}
