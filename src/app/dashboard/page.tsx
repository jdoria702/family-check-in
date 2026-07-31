"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  HeartPulse,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useRouter } from "next/navigation";

type LatestCheckIn = {
  id: string;
  generalFeeling: number;
  notes: string | null;
  submittedAt: string;
};

type DashboardMember = {
  memberId: string;
  name: string;
  checkedInToday: boolean;
  latestCheckIn: LatestCheckIn | null;
};

type DashboardResponse = {
  members?: DashboardMember[];
  error?: string;
};

type CreateCheckInResponse = {
  id?: string;
  memberId?: string;
  generalFeeling?: number;
  notes?: string | null;
  submittedAt?: string;
  error?: string;
  details?: {
    generalFeeling?: string[];
    notes?: string[];
  };
};

type InvitationResponse = {
  code?: string;
  expiresAt?: string;
  error?: string;
};

type CreatedInvitation = {
  code: string;
  expiresAt: string;
};

type InvitationPreview = {
  caretaker: {
    name: string;
  };
  expiresAt: string;
};

type PreviewInvitationResponse = {
  caretaker?: {
    name: string;
  };
  expiresAt?: string;
  error?: string;
  details?: {
    code?: string[];
  };
};

type ClaimInvitationResponse = {
  caretaker?: {
    name: string;
  };
  claimedAt?: string;
  relationshipId?: string;
  accessPeriodId?: string;
  error?: string;
  details?: {
    code?: string[];
  };
};

export default function CaretakerDashboardPage() {
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<CreatedInvitation | null>(null);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isJoinInvitationOpen, setIsJoinInvitationOpen] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const router = useRouter();

  const fetchDashboard = useCallback(
    async (signal?: AbortSignal): Promise<DashboardMember[]> => {
      const response = await fetch("/api/care/members", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
      });

      if (response.status === 401) {
        router.replace("/sign-in");
        return [];
      }

      const data = (await response.json()) as DashboardResponse;

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to load the dashboard."
        );
      }

      return data.members ?? [];
    },
    [router]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchDashboard(controller.signal)
      .then((dashboardMembers) => {
        if (!controller.signal.aborted) {
          setMembers(dashboardMembers);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [fetchDashboard]);

  async function handleRefresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const dashboardMembers = await fetchDashboard();
      setMembers(dashboardMembers);
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

  const completedCount = members.filter(
    (member) => member.checkedInToday
  ).length;

  const pendingCount = members.length - completedCount;

  async function handleCreateInvitation() {
    if (isCreatingInvitation) {
      return;
    }

    setIsCreatingInvitation(true);
    setInvitationError(null);

    try {
      const response = await fetch("/api/invitation", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as InvitationResponse;

      if (response.status === 401) {
        router.replace("/sign-in");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to create an invitation."
        );
      }

      if (!data.code || !data.expiresAt) {
        throw new Error(
          "The invitation API returned an incomplete response."
        );
      }

      setCreatedInvitation({
        code: data.code,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      setInvitationError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsCreatingInvitation(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Caretaker dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Your family
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              View today&apos;s check-in status and monitor how each family
              member is feeling.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
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

            <button
              type="button"
              onClick={() => setIsJoinInvitationOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Join Caretaker
            </button>

            <button
              type="button"
              onClick={() => void handleCreateInvitation()}
              disabled={isCreatingInvitation}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isCreatingInvitation ? (
                <>
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Invite Member
                </>
              )}
            </button>
          </div>
        </section>

        <YourCheckInCard />

        {!isLoading && !errorMessage && members.length > 0 && (
          <section
            aria-label="Dashboard summary"
            className="mt-8 grid gap-4 sm:grid-cols-3"
          >
            <SummaryCard
              label="Total members"
              value={members.length}
              icon={<Users className="h-5 w-5" aria-hidden="true" />}
            />

            <SummaryCard
              label="Checked in today"
              value={completedCount}
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            />

            <SummaryCard
              label="Still pending"
              value={pendingCount}
              icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
            />
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Members</h2>

            {!isLoading && members.length > 0 && (
              <p className="text-sm text-slate-500">
                {completedCount} of {members.length} checked in
              </p>
            )}
          </div>

          {isLoading && <DashboardLoadingState />}

          {!isLoading && errorMessage && (
            <DashboardErrorState
              message={errorMessage}
              onRetry={() => void handleRefresh()}
            />
          )}

          {!isLoading && !errorMessage && members.length === 0 && (
            <EmptyDashboardState
              onCreateInvitation={() => void handleCreateInvitation()}
              isCreatingInvitation={isCreatingInvitation}
            />
          )}

          {!isLoading && !errorMessage && members.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => (
                <MemberCard key={member.memberId} member={member} />
              ))}
            </div>
          )}
        </section>
      </div>

      {createdInvitation && (
        <InvitationModal
          invitation={createdInvitation}
          onClose={() => setCreatedInvitation(null)}
        />
      )}

      {isJoinInvitationOpen && (
        <JoinInvitationModal
          onClose={() => setIsJoinInvitationOpen(false)}
          onClaimed={() => {
            setIsJoinInvitationOpen(false);
            void handleRefresh();
          }}
        />
      )}
    </main>
  );
}

function formatInvitationExpiration(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "at an unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type InvitationModalProps = {
  invitation: CreatedInvitation;
  onClose: () => void;
};

function InvitationModal({
  invitation,
  onClose,
}: InvitationModalProps) {
  const [copied, setCopied] = useState(false);
  const formattedExpiration = formatInvitationExpiration(
    invitation.expiresAt
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(invitation.code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invitation-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="invitation-title"
              className="text-xl font-bold text-slate-900"
            >
              Invitation created
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Send this code to the family member you want to care
              for.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invitation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            Invitation code
          </p>

          <p className="mt-3 font-mono text-3xl font-bold tracking-[0.25em] text-slate-900">
            {invitation.code}
          </p>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            This code expires{" "}
            <span className="font-semibold text-slate-900">
              {formattedExpiration}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}

type JoinInvitationModalProps = {
  onClose: () => void;
  onClaimed: () => void;
};

function JoinInvitationModal({
  onClose,
  onClaimed,
}: JoinInvitationModalProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [preview, setPreview] =
    useState<InvitationPreview | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  async function handlePreview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isPreviewing || isClaiming) {
      return;
    }

    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setErrorMessage("Enter an invitation code.");
      return;
    }

    setIsPreviewing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreview(null);

    try {
      const response = await fetch(
        `/api/invitation?code=${encodeURIComponent(
          normalizedCode
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as PreviewInvitationResponse;

      if (response.status === 401) {
        router.replace("/sign-in");
        return;
      }

      if (!response.ok) {
        const validationError = data.details?.code?.[0];

        throw new Error(
          validationError ??
            data.error ??
            "Unable to preview the invitation."
        );
      }

      if (!data.caretaker || !data.expiresAt) {
        throw new Error(
          "The invitation preview response is incomplete."
        );
      }

      setPreview({
        caretaker: data.caretaker,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleClaimInvitation() {
    if (!preview || isClaiming) {
      return;
    }

    setIsClaiming(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/invitation", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: code.trim(),
        }),
      });

      const data =
        (await response.json()) as ClaimInvitationResponse;

      if (response.status === 401) {
        router.replace("/sign-in");
        return;
      }

      if (!response.ok) {
        const validationError = data.details?.code?.[0];

        throw new Error(
          validationError ??
            data.error ??
            "Unable to accept the invitation."
        );
      }

      setSuccessMessage(
        `You are now connected to ${preview.caretaker.name}.`
      );

      window.setTimeout(() => {
        onClaimed();
      }, 900);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsClaiming(false);
    }
  }

  function handleCodeChange(value: string) {
    setCode(value.toUpperCase());
    setPreview(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-invitation-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="join-invitation-title"
              className="text-xl font-bold text-slate-900"
            >
              Join a caretaker
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the invitation code provided by the person who
              will view your future check-ins.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isClaiming}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handlePreview} className="mt-6">
          <label
            htmlFor="invitation-code"
            className="block text-sm font-semibold text-slate-800"
          >
            Invitation code
          </label>

          <input
            id="invitation-code"
            name="code"
            type="text"
            value={code}
            onChange={(event) =>
              handleCodeChange(event.target.value)
            }
            disabled={isPreviewing || isClaiming}
            placeholder="Enter 8-character code"
            maxLength={8}
            autoComplete="off"
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-mono text-lg uppercase tracking-[0.15em] text-slate-900 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={
              code.trim().length === 0 ||
              isPreviewing ||
              isClaiming
            }
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPreviewing ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Checking code...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                Preview Invitation
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {successMessage}
          </div>
        )}

        {preview && !successMessage && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Invitation preview
            </p>

            <div className="mt-4">
              <p className="text-sm text-slate-600">
                Caretaker
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {preview.caretaker.name}
              </p>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Expires
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatInvitationExpiration(preview.expiresAt)}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm leading-6 text-amber-800">
                After accepting, this caretaker can see check-ins
                submitted during the active access period.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setErrorMessage(null);
                }}
                disabled={isClaiming}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use Different Code
              </button>

              <button
                type="button"
                onClick={() => void handleClaimInvitation()}
                disabled={isClaiming}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isClaiming ? (
                  <>
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Accept Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


const FEELING_OPTIONS = [
  {
    value: 1,
    label: "Very poor",
    emoji: "😞",
  },
  {
    value: 2,
    label: "Poor",
    emoji: "🙁",
  },
  {
    value: 3,
    label: "Okay",
    emoji: "😐",
  },
  {
    value: 4,
    label: "Good",
    emoji: "🙂",
  },
  {
    value: 5,
    label: "Great",
    emoji: "😊",
  },
] as const;

function YourCheckInCard() {
  const [generalFeeling, setGeneralFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (generalFeeling === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("api/check-ins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          generalFeeling,
          notes: notes.trim() === "" ? null : notes.trim(),
        }),
      });

      const data = (await response.json()) as CreateCheckInResponse;

      if (!response.ok) {
        const validationError =
          data.details?.generalFeeling?.[0] ??
          data.details?.notes?.[0];

        throw new Error(
          validationError ??
            data.error ??
            "Unable to submit your check-in."
        );
      }

      setSuccessMessage("Your check-in was submitted.");
      setGeneralFeeling(null);
      setNotes("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <HeartPulse className="h-5 w-5" aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Your check-in
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Record how you are feeling today. Your caretakers will only see
            this information if you have an active care relationship with
            them.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            How are you feeling today?
          </legend>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {FEELING_OPTIONS.map((option) => {
              const isSelected = generalFeeling === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setGeneralFeeling(option.value);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  disabled={isSubmitting}
                  aria-pressed={isSelected}
                  className={[
                    "flex min-h-20 flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition",
                    "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50",
                  ].join(" ")}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {option.emoji}
                  </span>

                  <span className="mt-1 text-xs font-semibold sm:text-sm">
                    {option.label}
                  </span>

                  <span className="mt-0.5 text-xs text-slate-500">
                    {option.value}/5
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5">
          <label
            htmlFor="check-in-notes"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800"
          >
            <MessageSquareText
              className="h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
            Notes
            <span className="font-normal text-slate-500">
              Optional
            </span>
          </label>

          <textarea
            id="check-in-notes"
            name="notes"
            rows={4}
            maxLength={300}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            disabled={isSubmitting}
            placeholder="Add anything you want your caretaker to know..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <div className="mt-1 flex justify-end">
            <span className="text-xs text-slate-500">
              {notes.length}/300
            </span>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {successMessage}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={generalFeeling === null || isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Submit Check-In
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function DashboardHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </span>

          <span className="font-bold text-slate-900">Family Check-In</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-blue-600"
          >
            Dashboard
          </Link>

          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </article>
  );
}

type MemberCardProps = {
  member: DashboardMember;
};

function MemberCard({ member }: MemberCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar name={member.name} />

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {member.name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">Family member</p>
          </div>
        </div>

        <CheckInStatus checkedIn={member.checkedInToday} />
      </div>

      <div className="mt-6 flex-1 rounded-xl bg-slate-50 p-4">
        {member.latestCheckIn ? (
          <LatestCheckInDetails checkIn={member.latestCheckIn} />
        ) : (
          <div>
            <p className="text-sm font-semibold text-slate-700">
              No check-in today
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              This member has not submitted a visible check-in for today.
            </p>
          </div>
        )}
      </div>

      <Link
        href={`/dashboard/members/${member.memberId}`}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        View History
      </Link>
    </article>
  );
}

function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
    >
      {initials || "?"}
    </div>
  );
}

function CheckInStatus({ checkedIn }: { checkedIn: boolean }) {
  if (checkedIn) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Checked in
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
      Pending
    </span>
  );
}

function LatestCheckInDetails({
  checkIn,
}: {
  checkIn: LatestCheckIn;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">
          Latest check-in
        </p>

        <p className="text-xs text-slate-500">
          {formatCheckInTime(checkIn.submittedAt)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-sm text-slate-600">General feeling</span>

        <FeelingScore score={checkIn.generalFeeling} />
      </div>

      {checkIn.notes && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </p>

          <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-700">
            {checkIn.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function FeelingScore({ score }: { score: number }) {
  const label = getFeelingLabel(score);

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
      <span>{getFeelingEmoji(score)}</span>
      {score}/5 · {label}
    </span>
  );
}

function DashboardLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-200" />

            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>

          <div className="mt-6 h-32 rounded-xl bg-slate-100" />
          <div className="mt-5 h-11 rounded-xl bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

type DashboardErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function DashboardErrorState({
  message,
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle
        className="mx-auto h-8 w-8 text-red-600"
        aria-hidden="true"
      />

      <h3 className="mt-3 text-base font-bold text-red-900">
        Unable to load dashboard
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  );
}

type EmptyDashboardStateProps = {
  onCreateInvitation: () => void;
  isCreatingInvitation: boolean;
};

function EmptyDashboardState({
  onCreateInvitation,
  isCreatingInvitation,
}: EmptyDashboardStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Users className="h-7 w-7" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">
        You are not caring for anyone yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Generate an invitation code and send it to a family member.
        After they accept it, you will be able to view their future
        check-ins.
      </p>

      <button
        type="button"
        onClick={onCreateInvitation}
        disabled={isCreatingInvitation}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isCreatingInvitation ? (
          <>
            <LoaderCircle
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            Creating invitation...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Invite Your First Member
          </>
        )}
      </button>
    </div>
  );
}

function formatCheckInTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
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