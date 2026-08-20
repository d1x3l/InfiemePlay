import React, { useState, useMemo, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const RENDER_BACKEND_URL = "https://infiemeplay-server.onrender.com"; 

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

function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#FF4D2E]/40 bg-[#141416]/95 px-4 py-3 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="h-2 w-2 rounded-full bg-[#FF4D2E] animate-pulse" />
          <div className="flex flex-col">
            <span className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-wider text-[#FF4D2E]">
              {toast.title}
            </span>
            <span className="text-sm font-medium text-[#F5F3EF]">
              {toast.message}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

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
        {connected ? "Stanza Connessa" : "Disconnesso / In attesa…"}
      </span>
    </div>
  );
}

function Header({ connected, roomCode, setRoomCode, username, setUsername, onJoinRoom, notificationsEnabled, onRequestNotifications }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRequestNotifications}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              notificationsEnabled
                ? "border-[#3ECF6E]/40 bg-[#3ECF6E]/10 text-[#3ECF6E]"
                : "border-[#FF4D2E]/40 bg-[#FF4D2E]/10 text-[#FF4D2E] hover:bg-[#FF4D2E] hover:text-black"
            }`}
          >
            {notificationsEnabled ? "🔔 Notifiche Attive" : "🔕 Attiva Pop-up"}
          </button>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#1E1E20] bg-[#141416] px-3 py-2">
            <span className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963] shrink-0">
              Nome
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo nome"
              maxLength={12}
              className="w-20 bg-transparent font-sans text-sm text-[#F5F3EF] placeholder-[#4A4944] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#1E1E20] bg-[#141416] px-3 py-2">
            <span className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963] shrink-0">
              Stanza
            </span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XKZ-491"
              maxLength={8}
              className="w-16 bg-transparent font-mono text-sm tracking-widest text-[#F5F3EF] placeholder-[#4A4944] outline-none"
            />
          </div>

          <button
            onClick={onJoinRoom}
            className="shrink-0 rounded-lg bg-[#FF4D2E] px-3 py-2 text-sm font-semibold text-[#0A0A0B] transition-opacity hover:opacity-90 active:scale-95"
          >
            {connected ? "Connesso" : "Entra"}
          </button>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-[#1E1E20] bg-[#141416] px-3 py-2 text-sm font-medium text-[#F5F3EF] hover:border-[#FF4D2E]/50 hover:text-[#FF4D2E]"
          >
            {copied ? "Copiato ✓" : "Condividi"}
          </button>
        </div>
      </div>
    </header>
  );
}

function MediaSelector({ mediaType, setMediaType, tmdbId, setTmdbId, season, setSeason, episode, setEpisode, provider, setProvider, onMediaChange }) {
  return (
    <div className="rounded-xl border border-[#1E1E20] bg-[#111113] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Sorgente Contenuto
        </span>
        <select
          value={provider}
          onChange={(e) => {
            const newProv = e.target.value;
            setProvider(newProv);
            onMediaChange({ mediaType, tmdbId, season, episode, provider: newProv });
          }}
          className="rounded border border-[#1E1E20] bg-[#0A0A0B] px-2 py-0.5 text-xs text-[#FF4D2E] outline-none cursor-pointer"
        >
          <option value="vixsrc">VixSrc (ITA)</option>
          <option value="vidsrc">VidSrc</option>
          <option value="autoembed">AutoEmbed</option>
        </select>
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
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${
                mediaType === opt.key ? "bg-[#FF4D2E] text-[#0A0A0B]" : "text-[#B8B6B0]"
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
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value.replace(/\D/g, ""))}
            placeholder="es. 550"
            className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] outline-none"
          />
        </div>

        {mediaType === "tv" && (
          <>
            <div className="flex w-full flex-col gap-1 sm:w-20">
              <label className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963]">Stagione</label>
              <input type="number" min={1} value={season} onChange={(e) => setSeason(e.target.value)} className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] outline-none" />
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-20">
              <label className="font-[Barlow_Condensed,sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#6B6963]">Episodio</label>
              <input type="number" min={1} value={episode} onChange={(e) => setEpisode(e.target.value)} className="rounded-lg border border-[#1E1E20] bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EF] outline-none" />
            </div>
          </>
        )}

        <button
          onClick={() => onMediaChange({ mediaType, tmdbId, season, episode, provider })}
          className="shrink-0 rounded-lg bg-[#1E1E20] border border-[#2A2A2C] px-4 py-2 text-sm font-semibold text-[#F5F3EF] hover:bg-[#FF4D2E] hover:text-black transition-colors"
        >
          Carica
        </button>
      </div>
    </div>
  );
}

function VideoPlayer({ src, onSyncAction, lastAction }) {
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
              Inserisci un ID TMDb per iniziare
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#1E1E20] bg-[#111113] px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSyncAction("play")}
            className="rounded bg-[#FF4D2E] px-3 py-1 text-xs font-bold text-black hover:opacity-90 active:scale-95 transition-transform"
          >
            ▶ Sync Play
          </button>
          <button
            onClick={() => onSyncAction("pause")}
            className="rounded bg-[#1E1E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#2A2A2C] active:scale-95 transition-transform"
          >
            ❚❚ Sync Pause
          </button>
        </div>
        {lastAction && (
          <span className="font-mono text-[11px] text-[#FF4D2E]">
            Azione: {typeof lastAction === "string" ? lastAction.toUpperCase() : lastAction?.action?.toUpperCase() || "SYNC"}
          </span>
        )}
      </div>
    </div>
  );
}

function ChatPanel({ messages, onSendMessage }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage(draft);
    setDraft("");
  };

  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-[#1E1E20] bg-[#111113]">
      <div className="border-b border-[#1E1E20] px-4 py-3">
        <span className="font-[Barlow_Condensed,sans-serif] text-[12px] uppercase tracking-[0.16em] text-[#6B6963]">
          Chat Stanza
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 max-h-[280px]">
        {messages.map((m, idx) => {
          if (m.system) {
            return (
              <div key={idx} className="my-1 text-center font-mono text-[11px] text-[#FF9F2E]">
                -- {m.text} --
              </div>
            );
          }

          return (
            <div key={idx} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
              <div
                className={`rounded-xl px-3 py-1.5 text-sm max-w-[85%] break-words ${
                  m.self
                    ? "bg-[#FF4D2E] text-[#0A0A0B] font-medium rounded-br-none"
                    : "bg-[#1E1E20] text-[#F5F3EF] rounded-bl-none border border-[#2A2A2C]"
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-[#6B6963] mt-1 px-1 font-mono">
                {m.self ? "Tu" : m.authorName}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#1E1E20] p-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-[#0A0A0B] border border-[#1E1E20] rounded-lg px-3 py-2 text-sm text-[#F5F3EF] outline-none focus:border-[#FF4D2E]/50"
        />
        <button
          onClick={handleSend}
          className="bg-[#FF4D2E] text-[#0A0A0B] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-transform"
        >
          Invia
        </button>
      </div>
    </div>
  );
}

export default function WatchParty() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("TEST12");
  const [username, setUsername] = useState("Utente");

  const [provider, setProvider] = useState("vixsrc");
  const [mediaType, setMediaType] = useState("movie");
  const [tmdbId, setTmdbId] = useState("550");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");

  const [messages, setMessages] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  
  const [toasts, setToasts] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const triggerNotification = (title, message) => {
    const newToast = { id: Date.now(), title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body: message, icon: "/favicon.ico" });
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
          triggerNotification("NOTIFICHE ATTIVATE", "Riceverai avvisi durante lo streaming!");
        }
      });
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }

    const newSocket = io(RENDER_BACKEND_URL, { autoConnect: false });
    setSocket(newSocket);

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));

    newSocket.on("receive_message", (msg) => {
      const authorText = typeof msg.author === "string" ? msg.author : (msg.author?.username || "Ospite");
      const isSelf = msg.socketId ? msg.socketId === newSocket.id : false;

      setMessages((prev) => [
        ...prev,
        { text: msg.text || "", authorName: authorText, self: isSelf, system: false }
      ]);

      if (!isSelf) {
        triggerNotification(`Messaggio da ${authorText}`, msg.text);
      }
    });

    newSocket.on("media_changed", (data) => {
      if (data.mediaType) setMediaType(data.mediaType);
      if (data.tmdbId) setTmdbId(data.tmdbId);
      if (data.season) setSeason(data.season);
      if (data.episode) setEpisode(data.episode);
      if (data.provider) setProvider(data.provider);

      setMessages((prev) => [
        ...prev,
        { text: `Nuovo contenuto caricato (ID: ${data.tmdbId})`, system: true }
      ]);

      triggerNotification("CAMBIO VIDEO", `È stato caricato un nuovo contenuto!`);
    });

    newSocket.on("sync_action", (actionData) => {
      setLastAction(actionData);
      const act = typeof actionData === "string" ? actionData : actionData?.action;
      const formattedAct = act ? act.toUpperCase() : "SYNC";

      setMessages((prev) => [
        ...prev,
        { text: `Comando Sync: ${formattedAct}`, system: true }
      ]);

      triggerNotification("SYNC PLAYER", `L'altro utente ha premuto: ${formattedAct}`);
    });

    newSocket.on("user_joined", (data) => {
      const name = data?.username || "Un utente";
      setMessages((prev) => [
        ...prev,
        { text: `${name} è entrato nella stanza`, system: true }
      ]);
      triggerNotification("STANZA", `${name} si è connesso`);
    });

    return () => newSocket.close();
  }, []);

  const handleJoinRoom = () => {
    if (!socket) return;
    if (!socket.connected) socket.connect();
    socket.emit("join_room", { roomId: roomCode, username: username || "Utente" });
  };

  const handleMediaChange = (newMedia) => {
    setMediaType(newMedia.mediaType);
    setTmdbId(newMedia.tmdbId);
    setSeason(newMedia.season);
    setEpisode(newMedia.episode);
    setProvider(newMedia.provider);

    if (socket && connected) {
      socket.emit("change_media", newMedia);
    }
  };

  const handleSyncAction = (action) => {
    setLastAction(action);
    if (socket && connected) {
      socket.emit("sync_action", { action, currentTime: 0 });
    }
  };

  const handleSendMessage = (text) => {
    if (socket && connected) {
      socket.emit("send_message", { text, username, socketId: socket.id });
    } else {
      setMessages((prev) => [
        ...prev,
        { text, authorName: "Tu", self: true, system: false }
      ]);
    }
  };

  const videoSrc = useMemo(
    () => buildEmbedUrl({ provider, mediaType, tmdbId, season, episode }),
    [provider, mediaType, tmdbId, season, episode]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F5F3EF]">
      <ToastContainer toasts={toasts} />

      <Header
        connected={connected}
        roomCode={roomCode}
        setRoomCode={setRoomCode}
        username={username}
        setUsername={setUsername}
        onJoinRoom={handleJoinRoom}
        notificationsEnabled={notificationsEnabled}
        onRequestNotifications={requestNotificationPermission}
      />

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
            
