import React, { useState, useMemo, useRef, useEffect } from "react";

/**
 * =============================================================================
 *  WATCH PARTY — Layout UI (solo struttura, nessuna logica di rete reale)
 * =============================================================================
 *  - Dark mode "sala di regia": nero caldo, accento segnale arancio-rosso,
 *    indicatore di sincronizzazione pulsante nell'header.
 *  - Colonna sinistra (≈70%): selettore TMDb + player 16:9 (iframe VixSrc).
 *  - Colonna destra (≈30%): riquadro cam locale/remota + chat.
 *  - Stacked su mobile, due colonne da `lg:` in su.
 *
 *  Font consigliati (aggiungere nel file HTML/Tailwind config):
 *  - "Barlow Condensed" per label/eyebrow/uppercase (mood "broadcast")
 *  - "Inter" per testo corrente (chat, input, corpo)
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Helper: costruisce l'URL dell'iframe VixSrc in base al tipo di contenuto
// -----------------------------------------------------------------------------
function buildVixSrcUrl({ mediaType, tmdbId, season, episode }) {
  if (!tmdbId) return null;

  if (mediaType === "movie") {
    return `https://vixsrc.to/embed/movie/${tmdbId}`;
  }

  if (mediaType === "tv") {
    // Servono sia stagione che episodio per una serie TV
    if (!season || !episode) return null;
    return `https://vixsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
  }

  return null;
}

// -----------------------------------------------------------------------------
// Sotto-componente: pallino di stato con pulse animato (signature element)
// -----------------------------------------------------------------------------
function SyncIndicator({ connected }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ECF6E] opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-[#3ECF6E]" : "bg-[#FF4D2E]"
          }`}
        />
      </span>
      <span
        className="font-[Barlow_Condensed,sans-serif] text-[13px] uppercase tracking-[0.18em] text-[#B8B6B0]"
      >
        {connected ? "Connesso" : "In attesa dell'altro utente…"}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sotto-componente: Header (titolo, stato connessione, codice stanza / link)
// -----------------------------------------------------------------------------
function Header({ connected, roomCode, setRoomCode }) {
  const [copied, setCopied] = useState(false);

  const shareLink = `https://watchparty.app/r/${roomCode || "------"}`;

  const handleCopy = () => {
    // Placeholder: in produzione userebbe navigator.clipboard.writeText(shareLink)
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#1E1E20] bg-[#0A0A0B]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        {/* Logo / titolo app */}
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FF4D2E]">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#0A0A0B]" />
            </div>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-xl font-semibold uppercase tracking-[0.08em] text-[#F5F3EF]">
              Watch<span className="text-[#FF4D2E]">Party</span>
            </h1>
          </div>

          {/* Stato connessione — visibile anche in versione compatta su mobile */}
          <div className="sm:hidden">
            <SyncIndicator connected={connected} />
          </div>
        </div>

        {/* Stato connessione desktop */}
        <div className="hidden sm:block">
          <SyncIndicator connected={connected} />
        </div>

        {/* Codice stanza / link condivisione */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#1E1E20] bg-[#141416] px-3 py-2 sm:w-72">
            <span className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963] shrink-0">
              Stanza
            </span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XKZ-491"
              maxLength={8}
              className="w-full bg-transparent font-mono text-sm tracking-widest text-[#F5F3EF] placeholder-[#4A4944] outline-none"
            />
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-[#1E1E20] bg-[#141416] px-3 py-2 text-sm font-medium text-[#F5F3EF] transition-colors hover:border-[#FF4D2E]/50 hover:text-[#FF4D2E] active:scale-95"
          >
            {copied ? "Copiato ✓" : "Condividi"}
          </button>
        </div>
      </div>
    </header>
  );
}

// -----------------------------------------------------------------------------
// Sotto-componente: selettore contenuto (TMDb ID + stagione/episodio)
// -----------------------------------------------------------------------------
function MediaSelector({
  mediaType,
  setMediaType,
  tmdbId,
  setTmdbId,
  season,
  setSeason,
  episode,
  setEpisode,
}) {
  return (
    <div className="rounded-xl border border-[#1E1E20] bg-[#111113] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Sorgente contenuto
        </span>
        <div className="h-px flex-1 bg-[#1E1E20]" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Toggle Film / Serie TV */}
        <div className="flex shrink-0 rounded-lg border border-[#1E1E20] bg-[#0A0A0B] p-1">
          {[
            { key: "movie", label: "Film" },
            { key: "tv", label: "Serie TV" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMediaType(opt.key)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                mediaType === opt.key
                  ? "bg-[#FF4D2E] text-[#0A0A0B]"
                  : "text-[#B8B6B0] hover:text-[#F5F3EF]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ID TMDb */}
        <div className="flex flex-1 flex-col gap-1">
          <label className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963]">
            ID TMDb
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value.replace(/\D/g, ""))}
            placeholder="es. 550 (Fight Club)"
            className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] placeholder-[#4A4944] outline-none focus:border-[#FF4D2E]/60"
          />
        </div>

        {/* Stagione / Episodio — solo per serie TV */}
        {mediaType === "tv" && (
          <>
            <div className="flex w-full flex-col gap-1 sm:w-24">
              <label className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963]">
                Stagione
              </label>
              <input
                type="number"
                min={1}
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] outline-none focus:border-[#FF4D2E]/60"
              />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-24">
              <label className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963]">
                Episodio
              </label>
              <input
                type="number"
                min={1}
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] outline-none focus:border-[#FF4D2E]/60"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sotto-componente: player video 16:9 con iframe VixSrc dinamico
// -----------------------------------------------------------------------------
function VideoPlayer({ src }) {
  return (
    <div className="group relative w-full overflow-hidden rounded-xl border border-[#1E1E20] bg-black">
      {/* Wrapper che forza il ratio 16:9 in modo responsive */}
      <div className="relative aspect-video w-full">
        {src ? (
          <iframe
            key={src} // forza il remount quando cambia il contenuto
            src={src}
            title="Player video sincronizzato"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          // Stato vuoto: nessun ID TMDb inserito ancora
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0D0D0E] px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A2C]">
              <div className="h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-[#4A4944]" />
            </div>
            <p className="font-[Barlow_Condensed,sans-serif] text-sm uppercase tracking-[0.12em] text-[#6B6963]">
              Inserisci un ID TMDb per avviare la riproduzione
            </p>
          </div>
        )}
      </div>

      {/* Etichetta LIVE-SYNC in overlay, coerente col signature element dell'header */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D2E]" />
        <span className="font-[Barlow_Condensed,sans-serif] text-[10px] uppercase tracking-[0.14em] text-[#F5F3EF]">
          Sync
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sotto-componente: riquadro con le due cam (locale + remota)
// -----------------------------------------------------------------------------
function CamPanel() {
  return (
    <div className="rounded-xl border border-[#1E1E20] bg-[#111113] p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Camera
        </span>
        <div className="h-px flex-1 bg-[#1E1E20]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Cam locale */}
        <div className="relative aspect-square overflow-hidden rounded-lg border border-[#1E1E20] bg-[#0A0A0B]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E1E20] text-[#6B6963]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M15 8.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5l4 3v-11l-4 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-[Barlow_Condensed,sans-serif] text-[10px] uppercase tracking-wider text-[#F5F3EF]">
            Tu
          </span>
        </div>

        {/* Cam remota */}
        <div className="relative aspect-square overflow-hidden rounded-lg border border-[#1E1E20] bg-[#0A0A0B]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E1E20] text-[#6B6963]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M15 8.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5l4 3v-11l-4 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-[Barlow_Condensed,sans-serif] text-[10px] uppercase tracking-wider text-[#F5F3EF]">
            Ospite
          </span>
          {/* Indicatore assenza segnale, coerente col mood "broadcast" */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#4A4944]" />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sotto-componente: chat in tempo reale (mock)
// -----------------------------------------------------------------------------
const MOCK_MESSAGES = [
  { id: 1, author: "Ospite", text: "Ci sono, parti pure!", self: false, time: "20:41" },
  { id: 2, author: "Tu", text: "Ok metto play tra 3… 2… 1…", self: true, time: "20:41" },
  { id: 3, author: "Ospite", text: "Questa scena è la mia preferita 🔥", self: false, time: "20:47" },
  { id: 4, author: "Tu", text: "Aspetta, torna indietro un attimo", self: true, time: "20:48" },
];

function ChatPanel() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: "Tu",
        text,
        self: true,
        time: new Date().toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#1E1E20] bg-[#111113]">
      <div className="flex items-center gap-2 border-b border-[#1E1E20] px-4 py-3">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Chat
        </span>
        <div className="h-px flex-1 bg-[#1E1E20]" />
        <span className="font-[Barlow_Condensed,sans-serif] text-[11px] text-[#4A4944]">
          {messages.length} messaggi
        </span>
      </div>

      {/* Lista messaggi */}
      <div
        ref={listRef}
        className="flex min-h-[180px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3 lg:max-h-[360px]"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-snug ${
                m.self
                  ? "bg-[#FF4D2E] text-[#0A0A0B]"
                  : "bg-[#1E1E20] text-[#F5F3EF]"
              }`}
            >
              {m.text}
            </div>
            <span className="mt-1 px-1 text-[10px] text-[#4A4944]">
              {m.self ? "Tu" : m.author} · {m.time}
            </span>
          </div>
        ))}
      </div>

      {/* Input invio messaggio */}
      <div className="flex items-center gap-2 border-t border-[#1E1E20] p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio…"
          className="flex-1 rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] placeholder-[#4A4944] outline-none focus:border-[#FF4D2E]/60"
        />
        <button
          onClick={handleSend}
          className="shrink-0 rounded-lg bg-[#FF4D2E] px-4 py-2 text-sm font-semibold text-[#0A0A0B] transition-opacity hover:opacity-90 active:scale-95"
        >
          Invia
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Componente principale
// -----------------------------------------------------------------------------
export default function WatchParty() {
  // Stato "finto" di connessione, solo per mostrare i due possibili stati UI
  const [connected] = useState(false);
  const [roomCode, setRoomCode] = useState("XKZ-491");

  // Stato selezione contenuto
  const [mediaType, setMediaType] = useState("movie");
  const [tmdbId, setTmdbId] = useState("550"); // Fight Club, come da esempio
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");

  const videoSrc = useMemo(
    () => buildVixSrcUrl({ mediaType, tmdbId, season, episode }),
    [mediaType, tmdbId, season, episode]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F5F3EF]">
      <Header connected={connected} roomCode={roomCode} setRoomCode={setRoomCode} />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        {/* Layout a due colonne (70/30) su desktop, stacked su mobile */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* ---------------- Colonna sinistra — 70% ---------------- */}
          <section className="flex w-full flex-col gap-4 lg:w-[70%]">
            <MediaSelector
              mediaType={mediaType}
              setMediaType={setMediaType}
              tmdbId={tmdbId}
              setTmdbId={setTmdbId}
              season={season}
              setSeason={setSeason}
              episode={episode}
              setEpisode={setEpisode}
            />
            <VideoPlayer src={videoSrc} />
          </section>

          {/* ---------------- Colonna destra — 30% ---------------- */}
          <aside className="flex w-full flex-col gap-4 lg:w-[30%]">
            <CamPanel />
            <ChatPanel />
          </aside>
        </div>
      </main>
    </div>
  );
    }
      
