/**
 * SignBEO.tsx
 *
 * Public client-facing signature page.
 * Route: /sign/:eventId  (mounted outside <Layout> — no auth, no sidebar)
 *
 * Flow:
 *   1. Read eventId from URL params
 *   2. Fetch the matching event_orders row via fetchBEOById()
 *   3. Display Event Name, Date, and Total Cost for the client to review
 *   4. Client draws their signature using SignaturePad
 *   5. "Accept" → PATCH event_orders via signBEO()
 *        sets status = 'Signed', signature_data, signer_name, signed_at
 *   6. The Supabase Realtime UPDATE fires → useAgentRealtime (in Bill's
 *      authenticated Layout) calls prependEntry() + triggerNewUpdate(),
 *      surfacing a gold-pulse badge and a "BEO Signed" card in the Executive Feed
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  AlertCircle,
  CalendarDays,
  Check,
  FileSignature,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchBEOById,
  signBEO,
  fmt$,
  fmtDate,
  styleLabel,
  type BEODocument,
} from "@/lib/beoGenerator";
import SignaturePad from "@/components/events/SignaturePad";

// ── Sub-components ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-stone-800">{value}</p>
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-stone-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Loading your proposal…</p>
      </div>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
        <h1 className="text-xl font-bold text-stone-800">Proposal Not Found</h1>
        <p className="text-stone-500 text-sm leading-relaxed">{message}</p>
        <p className="text-xs text-stone-400">
          Questions?{" "}
          <a
            href="mailto:northbusinessservices@gmail.com"
            className="text-amber-600 hover:underline"
          >
            northbusinessservices@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Confirmation screen (after signing) ──────────────────────────────────────

function ConfirmationScreen({
  doc,
  signerName,
}: {
  doc: BEODocument;
  signerName: string;
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="h-10 w-10 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-900">Order Accepted</h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Thank you{signerName ? `, ${signerName}` : ""}. Your signature for{" "}
            <strong className="text-stone-700">{doc.eventName}</strong> has been
            recorded and sent to Catering By Wendy.
          </p>
        </div>

        {/* Summary card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-left space-y-2 text-emerald-800">
          <p className="text-xs font-mono font-semibold opacity-70">
            {doc.beoNumber}
          </p>
          <p className="font-semibold">{doc.eventName}</p>
          <p className="text-sm opacity-80">
            {fmtDate(doc.eventDate)} · {styleLabel(doc.serviceStyle)}
          </p>
          <p className="text-xl font-bold mt-1">{fmt$(doc.total)}</p>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          Our team has been notified. For questions, reach us at{" "}
          <a
            href="mailto:northbusinessservices@gmail.com"
            className="text-amber-600 hover:underline"
          >
            northbusinessservices@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SignBEO() {
  const { eventId } = useParams<{ eventId: string }>();

  const [doc, setDoc] = useState<BEODocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Signature state
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [signerName, setSignerName] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  // ── Fetch BEO ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!eventId) {
      setFetchError("No event ID provided in this link.");
      setLoading(false);
      return;
    }

    fetchBEOById(eventId)
      .then((data) => {
        if (!data) {
          setFetchError(
            "This proposal could not be found. The link may be expired or incorrect."
          );
        } else {
          setDoc(data);
          const s = data.status.toLowerCase();
          if (s === "signed" || s === "accepted") {
            setSigned(true);
          }
        }
      })
      .catch((e: unknown) => {
        setFetchError(
          e instanceof Error ? e.message : "Unable to load proposal."
        );
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  // ── Signature handlers ─────────────────────────────────────────────────────

  function handleClear() {
    sigRef.current?.clear();
    setIsEmpty(true);
  }

  async function handleAccept() {
    if (!doc) return;

    if (isEmpty || !sigRef.current) {
      setSubmitError("Please draw your signature before accepting.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const dataUrl = sigRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      await signBEO(doc.id, dataUrl, signerName.trim());
      setSigned(true);
    } catch (e: unknown) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : "Could not save your signature. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingScreen />;
  if (fetchError || !doc) return <ErrorScreen message={fetchError ?? "This link may be invalid."} />;
  if (signed) return <ConfirmationScreen doc={doc} signerName={signerName} />;

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* ── Header ── */}
      <header className="bg-stone-800 text-white">
        <div className="max-w-lg mx-auto px-6 py-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400 mb-2">
              Catering By Wendy
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Event Proposal
            </h1>
            <p className="text-white/60 text-sm mt-1 font-mono">
              {doc.beoNumber}
            </p>
          </div>
          <span className="shrink-0 mt-1 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 text-[11px] font-semibold px-3 py-1 uppercase tracking-wider">
            Awaiting Signature
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* ── Event summary card ── */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-amber-500 shrink-0" />
            <h2 className="text-sm font-semibold text-stone-700">
              Event Details
            </h2>
          </div>

          <div className="px-6 py-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Event" value={doc.eventName || "—"} />
            <DetailRow label="Date" value={fmtDate(doc.eventDate) || "—"} />
            <DetailRow label="Style" value={styleLabel(doc.serviceStyle)} />
            <DetailRow label="Guests" value={`${doc.guestCount}`} />
          </div>

          {/* Total cost — visually prominent */}
          <div className="mx-6 mb-5 rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">
              Total Investment
            </span>
            <span className="text-2xl font-bold text-amber-600">
              {fmt$(doc.total)}
            </span>
          </div>

          {doc.specialInstructions && (
            <div className="mx-6 mb-5 rounded-xl border border-stone-100 bg-stone-50 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                {doc.specialInstructions}
              </p>
            </div>
          )}
        </div>

        {/* ── Signature block ── */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-amber-500 shrink-0" />
            <h2 className="text-sm font-semibold text-stone-700">
              Authorize This Proposal
            </h2>
          </div>

          <div className="px-6 py-5 space-y-5">
            <p className="text-sm text-stone-500 leading-relaxed">
              By signing below you confirm your agreement to the event details
              and pricing above. Catering By Wendy will be notified immediately.
            </p>

            {/* Printed name */}
            <div className="space-y-1.5">
              <label
                htmlFor="signer-name"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Your Full Name (printed)
              </label>
              <input
                id="signer-name"
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g. Alexandra Thompson"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition"
              />
            </div>

            {/* Signature pad */}
            <SignaturePad
              ref={sigRef}
              isEmpty={isEmpty}
              onBegin={() => setIsEmpty(false)}
              onClear={handleClear}
            />

            {/* Validation error */}
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <p className="text-[11px] text-gray-400 leading-relaxed">
              By clicking "Accept" you acknowledge that this constitutes a legal
              electronic signature and agree to the terms outlined in this
              proposal. Catering By Wendy · northbusinessservices@gmail.com
            </p>

            {/* Accept button */}
            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting || isEmpty}
              className={cn(
                "w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all",
                submitting || isEmpty
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg active:scale-[0.99]"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Accept
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center space-y-1">
          <p className="text-xs text-stone-400">
            Catering By Wendy · Professional Catering Services
          </p>
          <p className="text-xs text-stone-400">
            Questions?{" "}
            <a
              href="mailto:northbusinessservices@gmail.com"
              className="text-amber-600 hover:underline"
            >
              northbusinessservices@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
