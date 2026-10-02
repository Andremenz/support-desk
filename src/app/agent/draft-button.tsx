"use client";

import { useState } from "react";
import { agentReply, draftReply } from "@/app/agent/actions";

export function DraftButton({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(false);

    try {
      const result = await draftReply(ticketId);
      if (result.error) setError(true);
      else setDraft(result.text ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-3">
      <button
        className="rounded-md border border-purple-300 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 disabled:opacity-50"
        type="button"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Drafting…" : "✦ AI draft reply"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600">
          AI unavailable right now — please reply manually or use your standard
          macros.
        </p>
      )}
      {draft !== null && (
        <form action={agentReply} className="mt-2 space-y-2">
          <input type="hidden" name="ticketId" value={ticketId} />
          <textarea
            className="w-full rounded-md border border-purple-200 bg-purple-50 p-2 text-sm"
            name="body"
            rows={5}
            defaultValue={draft}
            maxLength={5000}
            required
          />
          <div className="flex gap-2">
            <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
              Edit &amp; send this reply
            </button>
            <button
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600"
              type="button"
              onClick={() => setDraft(null)}
            >
              Discard
            </button>
          </div>
          <p className="text-xs text-gray-500">
            AI suggestion — review and edit before sending. It is never sent
            automatically.
          </p>
        </form>
      )}
    </div>
  );
}
