import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          SupportDesk Login
        </h1>
        <LoginForm />
        <div className="mt-6 space-y-1 rounded border border-gray-200 bg-gray-50 p-3 text-center text-xs text-gray-500">
          <p className="font-semibold text-gray-700">
            Demo Accounts (Password: Password123!)
          </p>
          <p>alice@acme.com (Customer)</p>
          <p>maya@support.com (Agent)</p>
          <p>sam@support.com (Founder)</p>
        </div>
      </div>
    </main>
  );
}
