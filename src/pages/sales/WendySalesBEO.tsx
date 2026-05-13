/**
 * Wendy-branded “Close Deal” BEO-lite page — QR + E-Signature handoff routes.
 */

import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileSignature, Mail, Phone, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { useEventContext } from "@/context/EventContext";

export default function WendySalesBEO() {
  const [search] = useSearchParams();
  const { eventState } = useEventContext();

  const eventId =
    search.get("eventId") ?? eventState?.eventId ?? "preview-harrison-sale";
  const eventName =
    search.get("event") ?? eventState?.eventName ?? "Harrison Gala — Prospect Deck";

  const signUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sign/${encodeURIComponent(eventId)}`
      : `/sign/${eventId}`;
  const contactMail = `mailto:sales@deliciousdemo.co?subject=${encodeURIComponent("Wendy BEO Confirmation — " + eventName)}`;
  const conciergePhone = "tel:+18555513450";

  const qrValue = signUrl;

  const summaryBullets = useMemo(
    () => [
      "Safety-first storm rehearsal captured in Venue Architect overlays.",
      "Margin guardrails tethered to live Scout_NBS comps per asset.",
      "Service choreography locked with 7PM lighting + waiter loop storytelling.",
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-slate-900 to-black text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-14">
        <header className="text-center space-y-4 border-b border-amber-500/35 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/70 bg-amber-500/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
            <Sparkles className="h-3 w-3" aria-hidden />
            Delicious Catering · Wendy Narrative Desk
          </div>
          <h1 className="font-serif text-4xl text-white md:text-5xl">{eventName}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Prospect-facing Business Event Order appendix with digital signature parity and concierge QR blocks—built for showroom
            handoffs straight from Venue Architect Presentation Mode.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-8 items-start">
          <div className="rounded-xl border border-amber-500/35 bg-white/95 p-6 text-slate-900 shadow-xl">
            <h2 className="font-serif text-2xl text-slate-900 mb-4 flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-amber-600 shrink-0" aria-hidden /> E‑Signature Corridor
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Direct your client into the audited signing corridor. Mirrors the production SignBEO stack with concierge gold
              treatment for demo tours.
            </p>
            <Link
              to={`/sign/${encodeURIComponent(eventId)}`}
              className={cn(
                "inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-lg bg-[#fbbf24] px-6 py-3",
                "text-slate-950 font-bold uppercase tracking-wide text-sm hover:bg-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.45)]",
              )}
            >
              Authorize Catering Agreement
            </Link>
          </div>

          <div className="rounded-xl border border-cyan-500/35 bg-slate-950 p-6 flex flex-col items-center gap-4">
            <h2 className="font-serif text-xl text-[#67e8f9] uppercase tracking-[0.2em]">
              Wendy Concierge QR
            </h2>
            <p className="text-center text-xs text-slate-400 max-w-[240px]">
              Scan → loads the immutable signing handshake URL for this rehearsal event ({eventId}).
            </p>
            <div className="rounded-lg bg-white p-4 shadow-inner">
              <QRCodeSVG value={qrValue} size={180} level="Q" fgColor="#0f172a" bgColor="#ffffff" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/80 bg-slate-950/85 p-6 space-y-4">
          <h3 className="font-serif text-xl text-[#fbbf24] mb-3">Talking points anchored in Venue Architect</h3>
          <ul className="list-disc ml-6 text-slate-300 space-y-2">
            {summaryBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="grid sm:grid-cols-2 gap-4 pb-24">
          <a
            href={contactMail}
            className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 hover:border-[#fbbf24]/55 transition-colors"
          >
            <Mail className="h-5 w-5 text-[#fbbf24]" aria-hidden />
            <div>
              <p className="text-xs uppercase text-slate-500 tracking-wider">Executive Concierge</p>
              <p className="font-semibold">sales@deliciousdemo.co</p>
            </div>
          </a>
          <a
            href={conciergePhone}
            className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 hover:border-cyan-500/55 transition-colors"
          >
            <Phone className="h-5 w-5 text-cyan-400" aria-hidden />
            <div>
              <p className="text-xs uppercase text-slate-500 tracking-wider">24/7 Event Line</p>
              <p className="font-semibold">1-855‑551‑3450</p>
            </div>
          </a>
        </section>
      </div>
    </div>
  );
}
