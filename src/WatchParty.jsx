import React, { useState, useMemo, useRef, useEffect } from "react";

// -----------------------------------------------------------------------------
// Helper: costruisce l'URL in base al Provider selezionato e al contenuto
// -----------------------------------------------------------------------------
function buildEmbedUrl({ provider, mediaType, tmdbId, season, episode }) {
  if (!tmdbId) return null;

  const isMovie = mediaType === "movie";
  if (!isMovie && (!season || !episode)) return null;

  switch (provider) {
    case "vixsrc":
      return isMovie
        ? `https://vixsrc.to/embed/movie/${tmdbId}`
        : `https://vixsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
    case "vidsrc":
      return isMovie
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
    case "autoembed":
      return isMovie
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
    default:
      return null;
  }
}

// -----------------------------------------------------------------------------
// Sotto-componente: pallino di stato
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
      <span className="font-[Barlow_Condensed,sans-serif] text-[13px] uppercase tracking-[0.18em] text-[#B8B6B0]">
        {connected ? "Connesso" : "In attesa dell'altro utente…"}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sotto-componente: Header
// -----------------------------------------------------------------------------
function Header({ connected, roomCode, setRoomCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#1E1E20] bg-[#0A0A0B]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FF4D2E]">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#0A0A0B]" />
            </div>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-xl font-semibold uppercase tracking-[0.08em] text-[#F5F3EF]">
              Watch<span className="text-[#FF4D2E]">Party</span>
            </h1>
          </div>
          <div className="sm:hidden">
            <SyncIndicator connected={connected} />
          </div>
        </div>

        <div className="hidden sm:block">
          <SyncIndicator connected={connected} />
        </div>

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
// Sotto-componente: MediaSelector (con cambio Server/Provider)
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
  provider,
  setProvider,
}) {
  return (
    <div className="rounded-xl border border-[#1E1E20] bg-[#111113] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Sorgente Contenuto
        </span>
        
        {/* Selettore Server/Provider */}
        <div className="flex items-center gap-1.5">
          <span className="font-[Barlow_Condensed,sans-serif] text-[10px] uppercase text-[#6B6963]">
            Server:
          </span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border border-[#1E1E20] bg-[#0A0A0B] px-2 py-0.5 text-xs text-[#FF4D2E] outline-none cursor-pointer"
          >
            <option value="vixsrc">VixSrc (Default)</option>
            <option value="vidsrc">VidSrc (Alt 1)</option>
            <option value="autoembed">AutoEmbed (Alt 2)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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

        <div className="flex flex-1 flex-col gap-1">
          <label className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963]">
            ID TMDb
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value.replace(/\D/g, ""))}
            placeholder="es. 550"
            className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] outline-none focus:border-[#FF4D2E]/60"
          />
        </div>

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
// Sotto-componente: VideoPlayer
// -----------------------------------------------------------------------------
function VideoPlayer({ src }) {
  return (
    <div className="group relative w-full overflow-hidden rounded-xl border border-[#1E1E20] bg-black">
      <div className="relative aspect-video w-full">
        {src ? (
          <iframe
            key={src}
            src={src}
            title="Player video"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0D0D0E] px-6 text-center">
            <p className="font-[Barlow_Condensed,sans-serif] text-sm uppercase tracking-[0.12em] text-[#6B6963]">
              Inserisci un ID TMDb per avviare la riproduzione
            </p>
          </div>
        )}
      </div>

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
// CamPanel & ChatPanel
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
        <div className="relative aspect-square overflow-hidden rounded-lg border border-[#1E1E20] bg-[#0A0A0B]">
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-[Barlow_Condensed,sans-serif] text-[10px] uppercase text-[#F5F3EF]">
            Tu
          </span>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-lg border border-[#1E1E20] bg-[#0A0A0B]">
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-[Barlow_Condensed,sans-serif] text-[10px] uppercase text-[#F5F3EF]">
            Ospite
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    { id: 1, author: "Ospite", text: "Ci sono, parti pure!", self: false, time: "20:41" },
  ]);
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), author: "Tu", text: draft, self: true, time: "Ora" },
    ]);
    setDraft("");
  };

  return (
    <div className="flex min-h-[300px] flex-col rounded-xl border border-[#1E1E20] bg-[#111113]">
      <div className="border-b border-[#1E1E20] px-4 py-3">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Chat
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
            <div className={`rounded-lg px-3 py-1.5 text-sm ${m.self ? "bg-[#FF4D2E] text-black" : "bg-[#1E1E20] text-white"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#1E1E20] p-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Messaggio..."
          className="flex-1 bg-[#0A0A0B] border border-[#1E1E20] rounded px-3 text-sm text-white outline-none"
        />
        <button onClick={handleSend} className="bg-[#FF4D2E] text-black px-3 py-1 rounded font-bold text-sm">
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
  const [connected] = useState(false);
  const [roomCode, setRoomCode] = useState("XKZ-491");
  
  const [provider, setProvider] = useState("vixsrc");
  const [mediaType, setMediaType] = useState("movie");
  const [tmdbId, setTmdbId] = useState("550");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");

  const videoSrc = useMemo(
    () => buildEmbedUrl({ provider, mediaType, tmdbId, season, episode }),
    [provider, mediaType, tmdbId, season, episode]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F5F3EF]">
      <Header connected={connected} roomCode={roomCode} setRoomCode={setRoomCode} />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
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
              provider={provider}
              setProvider={setProvider}
            />
            <VideoPlayer src={videoSrc} />
          </section>

          <aside className="flex w-full flex-col gap-4 lg:w-[30%]">
            <CamPanel />
            <ChatPanel />
          </aside>
        </div>
      </main>
    </div>
  );
    }
            
