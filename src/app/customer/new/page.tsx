import { createTicket } from "@/app/customer/actions";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        New support request
      </h1>
      <form
        action={createTicket}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="subject"
          >
            Subject
          </label>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
            id="subject"
            name="subject"
            placeholder="Short summary of the problem"
            minLength={5}
            maxLength={120}
            required
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="body"
          >
            Description
          </label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
            id="body"
            name="body"
            placeholder="What happened? What did you expect?"
            minLength={10}
            maxLength={5000}
            rows={6}
            required
          />
        </div>
        {error === "invalid" && (
          <p className="text-sm text-red-700" role="alert">
            Subject must be 5–120 characters and description at least 10
            characters.
          </p>
        )}
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Submit request
        </button>
      </form>
    </div>
  );
}
