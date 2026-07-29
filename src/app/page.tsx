import Link from "next/link";
import { HeartPulse } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6">
        <header className="flex h-20 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <HeartPulse className="h-6 w-6" aria-hidden="true" />
            </div>

            <span className="text-lg font-bold">Family Check-In</span>
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-xl text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-600">
              <HeartPulse className="h-10 w-10" aria-hidden="true" />
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Family wellness made simple
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Stay connected with the people you care about
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Complete simple daily check-ins, monitor wellness over time, and
              help your family stay informed about how everyone is feeling.
            </p>

            <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Log In
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Create Account
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              Private health check-ins for you and your family.
            </p>
          </div>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Family Check-In
        </footer>
      </div>
    </main>
  );
}