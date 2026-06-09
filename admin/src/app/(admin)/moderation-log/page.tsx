"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ModerationLogRow = {
  id: string;
  action: string;
  targetId: string;
  targetType: string;
  note: string | null;
  createdAt: string;
  admin: { fullName: string };
};

const ACTION_LABELS: Record<string, string> = {
  remove_paper:   "Removed paper",
  remove_comment: "Removed comment",
  warn_user:      "Warned user",
  ban_user:       "Banned user",
  unban_user:     "Unbanned user",
  review_report:  "Reviewed report",
  dismiss_report: "Dismissed report",
};

function formatAction(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function targetLink(type: string, id: string) {
  if (type === "user") return `/users/${id}`;
  if (type === "paper") return `/papers/${id}`;
  return null;
}

export default function ModerationLogPage() {
  const [logs, setLogs] = useState<ModerationLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/moderation-log");
        const json = await res.json() as { success?: boolean; data?: ModerationLogRow[]; error?: string };
        if (!res.ok || !json.success) {
          setError(json.error ?? "Failed to load moderation log.");
          return;
        }
        setLogs(json.data ?? []);
      } catch {
        setError("Failed to load moderation log.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moderation Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit trail of admin actions — bans, warnings, and content removals.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No moderation actions recorded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">When</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Admin</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Target</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const href = targetLink(log.targetType, log.targetId);
                return (
                  <tr key={log.id} className="hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.admin.fullName}</td>
                    <td className="px-4 py-3 text-gray-800">{formatAction(log.action)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="mr-1 text-xs uppercase text-gray-400">{log.targetType}</span>
                      {href ? (
                        <Link href={href} className="font-medium text-[#0066ff] hover:underline">
                          {log.targetId.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span>{log.targetId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500" title={log.note ?? undefined}>
                      {log.note ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
