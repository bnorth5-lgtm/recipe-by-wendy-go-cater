/**
 * ClientPortal.tsx
 *
 * Public-facing, nav-free BEO signing page.
 * Route: /portal/:proposalId  (mounted outside <Layout> in App.tsx)
 *
 * Flow:
 *   1. Fetch the BEO from event_orders by UUID (proposalId)
 *   2. Render a clean, luxury client-facing version of the BEO
 *      (no COGS internals — clients see Menu, Run of Show, and Total)
 *   3. Client types their name + draws a signature
 *   4. "Finalize Order" → PATCH event_orders.status = 'Signed',
 *      saves signature_data (Base64 PNG) + signer_name + signed_at
 *   5. The PATCH fires a Realtime UPDATE which triggers the gold pulse
 *      on the Executive tab via the existing useAgentRealtime subscription
 */

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  CalendarDays,
  Check,
  ChefHat,
  Clock,
  Loader2,
  MapPin,
  PenLine,
  Users,
  AlertCircle,
  FileSignature,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchBEOById,
  signBEO,
  fmt$,
  fmtDate,
  fmtServiceTime,
  styleLabel,
  type BEODocument,
  type RunOfShowEntry,
} from "@/lib/beoGenerator";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-gray-800">
        <span className="text-amber-600">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}

function Divider() {
  return <hr className="border-t border-gray-100 my-6" />;
}

function RunEntry({ entry, last }: { entry: RunOfShowEntry; last: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-3 text-sm",
        !last && "border-b border-gray-100",
        entry.isKeyMoment && "bg-gray-800 text-white rounded-lg"
      )}
    >
      <span
        className={cn(
          "shrink-0 font-mono text-xs w-16 pt-0.5 font-semibold",
          entry.isKeyMoment ? "text-white/70" : "text-gray-400"
        )}
      >
        {entry.time}
      </span>
      <p className={cn("flex-1", entry.isKeyMoment ? "font-bold" : "text-gray-700")}>
        {entry.task}
      </p>
      <span
        className={cn(
          "shrink-0 text-[10px] rounded px-1.5 py-0.5 font-medium border",
          entry.isKeyMoment
            ? "border-white/20 text-white/70 bg-white/10"
            : "border-gray-200 text-gray-500"
        )}
      >
        {entry.owner}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { proposalId } = useParams<{ proposalId: string }>();

  const [doc, setDoc] = useState<BEODocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signature state
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [signerName, setSignerName] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Fetch BEO ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!proposalId) {
      setError("No proposal ID provided.");
      setLoading(false);
      return;
    }

    fetchBEOById(proposalId)
      .then((data) => {
        if (!data) {
          setError("This proposal could not be found. It may have expired or the link is incorrect.");
        } else {
          setDoc(data);
          // Already signed?
          if (
            data.status.toLowerCase() === "signed" ||
            data.status.toLowerCase() === "accepted"
          ) {
            setSigned(true);
          }
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Unable to load proposal.");
      })
      .finally(() => setLoading(false));
  }, [proposalId]);

  // ── Signature handlers ─────────────────────────────────────────────────────

  function handleClear() {
    sigRef.current?.clear();
    setIsEmpty(true);
  }

  async function handleFinalize() {
    if (!doc) return;
    if (isEmpty || !sigRef.current) {
      setSubmitError("Please draw your signature before finalizing.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      await signBEO(doc.id, dataUrl, signerName.trim());
      setSigned(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Could not save your signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-stone-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Loading your proposal…</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
          <h1 className="text-xl font-semibold text-gray-800">Proposal Not Found</h1>
          <p className="text-gray-500 text-sm">{error ?? "This link may be invalid."}</p>
          <p className="text-xs text-gray-400">
            Questions? Email us at{" "}
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

  // ── Signed confirmation screen ─────────────────────────────────────────────

  if (signed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Order Confirmed</h1>
            <p className="text-gray-600">
              Thank you{signerName ? `, ${signerName}` : ""}. Your proposal for{" "}
              <strong>{doc.eventName}</strong> has been signed and sent to Delicious Catering & Events.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-left space-y-1 text-emerald-800">
            <p className="font-semibold">{doc.beoNumber}</p>
            <p>{fmtDate(doc.eventDate)} · {styleLabel(doc.serviceStyle)}</p>
            <p className="text-lg font-bold mt-2">{fmt$(doc.total)}</p>
          </div>
          <p className="text-xs text-gray-400">
            A copy has been noted by our team. For any questions, contact us at{" "}
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

  // ── Main portal view ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white print:from-white print:to-white print:text-gray-900 print:border-b-2 print:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              {/* Logo / branding */}
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400 mb-2">
                Delicious Catering & Events
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                Event Proposal
              </h1>
              <p className="text-lg text-white/70 mt-1">{doc.eventName}</p>
            </div>
            <div className="text-right text-sm space-y-1 shrink-0">
              <p className="font-mono text-xs text-white/60">
                {doc.beoNumber}
              </p>
              <p className="text-white/60 text-xs">
                Prepared {fmtDate(doc.generatedAt)}
              </p>
              <span className="inline-block rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 text-[11px] font-semibold px-3 py-0.5 uppercase tracking-wider">
                Awaiting Signature
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-0">
        {/* ── Event Details ── */}
        <Section icon={<CalendarDays className="h-4 w-4" />} title="Event Details">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <Row label="Date" value={fmtDate(doc.eventDate) || "—"} />
            <Row label="Service Start" value={fmtServiceTime(doc.serviceTime) || "—"} />
            <Row label="Style" value={styleLabel(doc.serviceStyle)} />
            <Row label="Guests" value={`${doc.guestCount}`} />
            <Row
              label="Venue"
              value={[doc.venueName, doc.venueZip].filter(Boolean).join(", ") || "—"}
            />
          </div>
          {doc.specialInstructions && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {doc.specialInstructions}
              </p>
            </div>
          )}
        </Section>

        <Divider />

        {/* ── Proposed Menu ── */}
        <Section icon={<ChefHat className="h-4 w-4" />} title="Proposed Menu">
          <div className="space-y-3">
            {doc.menuSections.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No menu items included.</p>
            ) : (
              doc.menuSections.map((section) => (
                <div
                  key={section.recipeId}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{section.recipeName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {section.category} · Scaled for {doc.guestCount} guests
                      </p>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Divider />

        {/* ── Run of Show ── */}
        <Section icon={<Clock className="h-4 w-4" />} title="Day-of Timeline">
          <p className="text-sm text-gray-500">
            Service start:{" "}
            <strong className="text-gray-700">{fmtServiceTime(doc.serviceTime)}</strong> ·{" "}
            {doc.guestCount} guests · {styleLabel(doc.serviceStyle)}
          </p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {doc.runOfShow.map((entry, i) => (
              <RunEntry
                key={i}
                entry={entry}
                last={i === doc.runOfShow.length - 1}
              />
            ))}
          </div>
        </Section>

        <Divider />

        {/* ── Investment Summary ── */}
        <Section icon={<Users className="h-4 w-4" />} title="Investment Summary">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            <div className="flex justify-between px-5 py-3 text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-800">{fmt$(doc.subtotal)}</span>
            </div>
            <div className="flex justify-between px-5 py-3 text-sm text-gray-600">
              <span>Tax ({(doc.taxRate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-gray-800">{fmt$(doc.taxAmount)}</span>
            </div>
            <div className="flex justify-between px-5 py-4 bg-stone-50">
              <span className="font-bold text-gray-900 text-base">Total</span>
              <span className="font-bold text-amber-600 text-xl">{fmt$(doc.total)}</span>
            </div>
            <div className="flex justify-between px-5 py-3 text-xs text-gray-500">
              <span>Per-person rate</span>
              <span>{fmt$(doc.perPersonRate)} / guest</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            All pricing is estimated and subject to final confirmation. Equipment
            rentals and market-rate ingredients may fluctuate.
          </p>
        </Section>

        <Divider />

        {/* ── Venue / Contact ── */}
        {(doc.venueName || doc.venueZip) && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                {[doc.venueName, doc.venueZip].filter(Boolean).join(", ")}
              </span>
            </div>
            <Divider />
          </>
        )}

        {/* ── Signature Block ── */}
        <Section
          icon={<FileSignature className="h-4 w-4" />}
          title="Authorize This Proposal"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Instructions */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                By signing below, you confirm your agreement to the menu, timeline,
                and pricing outlined in this proposal. Delicious Catering & Events will be
                notified immediately upon finalization.
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
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

              {/* Signature canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <PenLine className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                    Signature
                  </label>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Clear
                  </button>
                </div>

                <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden transition-colors focus-within:border-amber-400">
                  <SignatureCanvas
                    ref={sigRef}
                    penColor="#1c1917"
                    canvasProps={{
                      width: 640,
                      height: 160,
                      className: "w-full h-40 touch-none cursor-crosshair",
                    }}
                    onBegin={() => setIsEmpty(false)}
                  />
                  {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-sm text-gray-300 select-none">
                        Sign here with your mouse or finger
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              {/* Agreement copy */}
              <p className="text-[11px] text-gray-400 leading-relaxed">
                By clicking "Finalize Order" you acknowledge that this constitutes a
                legal electronic signature and agree to the terms outlined in this
                proposal. Delicious Catering & Events · northbusinessservices@gmail.com
              </p>

              {/* Submit */}
              <button
                type="button"
                onClick={handleFinalize}
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
                    Finalizing…
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Finalize Order
                  </>
                )}
              </button>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="pt-12 pb-8 text-center space-y-1.5">
          <p className="text-xs text-gray-400">
            Delicious Catering & Events · Professional Catering Services
          </p>
          <p className="text-xs text-gray-400">
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
