"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";

type CheckIn = {
  id: string;
  generalFeeling: number;
  notes: string | null;
  submittedAt: string;
};

type Member = {
  id: string;
  name: string;
};

type MemberHistoryResponse = {
  member?: Member;
  checkIns?: CheckIn[];
  error?: string;
};

export default function MemberHistoryPage() {
  const params = useParams<{ memberId: string }>();
  const router = useRouter();

  const memberId = params.memberId;

  const [member, setMember] = useState<Member | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchHistory() {
      try {
        const response = await fetch(
          `/api/care/members/${encodeURIComponent(memberId)}/history`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          router.replace("/sign-in");
          return;
        }

        const data = (await response.json()) as MemberHistoryResponse;

        if (!response.ok) {
          throw new Error(
            data.error ?? "Unable to load the member's history."
          );
        }

        if (!data.member) {
          throw new Error("The member history response is incomplete.");
        }

        setMember(data.member);
        setCheckIns(data.checkIns ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchHistory();

    return () => {
      controller.abort();
    };
  }, [memberId, router]);

  async function refreshHistory() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/care/members/${encodeURIComponent(memberId)}/history`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/sign-in");
        return;
      }

      const data = (await response.json()) as MemberHistoryResponse;

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to refresh the member's history."
        );
      }

      if (!data.member) {
        throw new Error("The member history response is incomplete.");
      }

      setMember(data.member);
      setCheckIns(data.checkIns ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <HistoryHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to dashboard
            </Link>

            <p className="mt-6 text-sm font-semibold text-blue-600">
              Member history
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? "Loading member..." : member?.name ?? "Member"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              View the check-ins shared with you during your active access
              period.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshHistory()}
            disabled={isLoading || isRefreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}

            Refresh
          </button>
        </div>

        {isLoading && <HistoryLoadingState />}

        {!isLoading && errorMessage && (
          <HistoryErrorState
            message={errorMessage}
            onRetry={() => void refreshHistory()}
          />
        )}

        {!isLoading && !errorMessage && member && (
          <>
            <HistorySummary member={member} checkIns={checkIns} />

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Check-in history
                </h2>

                <p className="text-sm text-slate-500">
                  {checkIns.length}{" "}
                  {checkIns.length === 1 ? "check-in" : "check-ins"}
                </p>
              </div>

              {checkIns.length === 0 ? (
                <EmptyHistoryState memberName={member.name} />
              ) : (
                <div className="space-y-4">
                  {checkIns.map((checkIn) => (
                    <CheckInCard key={checkIn.id} checkIn={checkIn} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function HistoryHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </span>

          <span className="font-bold text-slate-900">
            Family Check-In
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}

type HistorySummaryProps = {
  member: Member;
  checkIns: CheckIn[];
};

function HistorySummary({
  member,
  checkIns,
}: HistorySummaryProps) {
  const latestCheckIn = checkIns[0] ?? null;
  const averageFeeling = calculateAverageFeeling(checkIns);

  return (
    <section
      aria-label={`${member.name}'s check-in summary`}
      className="mt-8 grid gap-4 sm:grid-cols-3"
    >
      <SummaryCard
        label="Visible check-ins"
        value={String(checkIns.length)}
        icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
      />

      <SummaryCard
        label="Average feeling"
        value={
          averageFeeling === null
            ? "No data"
            : `${averageFeeling.toFixed(1)}/5`
        }
        icon={<HeartPulse className="h-5 w-5" aria-hidden="true" />}
      />

      <SummaryCard
        label="Latest check-in"
        value={
          latestCheckIn
            ? formatRelativeDate(latestCheckIn.submittedAt)
            : "No data"
        }
        icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
      />
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

function SummaryCard({
  label,
  value,
  icon,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </article>
  );
}

function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
            <span aria-hidden="true">
              {getFeelingEmoji(checkIn.generalFeeling)}
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              General feeling
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {checkIn.generalFeeling}/5 ·{" "}
              {getFeelingLabel(checkIn.generalFeeling)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock3 className="h-4 w-4" aria-hidden="true" />

          <time dateTime={checkIn.submittedAt}>
            {formatCheckInDate(checkIn.submittedAt)}
          </time>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <MessageSquareText
            className="h-4 w-4 text-slate-500"
            aria-hidden="true"
          />

          <h3 className="text-sm font-semibold text-slate-800">
            Notes
          </h3>
        </div>

        {checkIn.notes ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {checkIn.notes}
          </p>
        ) : (
          <p className="mt-2 text-sm italic text-slate-500">
            No notes were provided.
          </p>
        )}
      </div>
    </article>
  );
}

function HistoryLoadingState() {
  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

type HistoryErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function HistoryErrorState({
  message,
  onRetry,
}: HistoryErrorStateProps) {
  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle
        className="mx-auto h-8 w-8 text-red-600"
        aria-hidden="true"
      />

      <h2 className="mt-3 text-lg font-bold text-red-900">
        Unable to load history
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  );
}

function EmptyHistoryState({
  memberName,
}: {
  memberName: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">
        No visible check-ins
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {memberName} has not submitted any check-ins during your
        current access period.
      </p>
    </div>
  );
}

function calculateAverageFeeling(checkIns: CheckIn[]) {
  if (checkIns.length === 0) {
    return null;
  }

  const total = checkIns.reduce(
    (sum, checkIn) => sum + checkIn.generalFeeling,
    0
  );

  return total / checkIns.length;
}

function formatCheckInDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startOfCheckInDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const differenceInDays = Math.round(
    (startOfToday.getTime() - startOfCheckInDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getFeelingLabel(score: number) {
  switch (score) {
    case 1:
      return "Very poor";
    case 2:
      return "Poor";
    case 3:
      return "Okay";
    case 4:
      return "Good";
    case 5:
      return "Great";
    default:
      return "Unknown";
  }
}

function getFeelingEmoji(score: number) {
  switch (score) {
    case 1:
      return "😞";
    case 2:
      return "🙁";
    case 3:
      return "😐";
    case 4:
      return "🙂";
    case 5:
      return "😊";
    default:
      return "—";
  }
}