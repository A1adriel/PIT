import { useState, useEffect, useRef } from "react";

const API = "/api";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function randomColor(name) {
  const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#14b8a6"];
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Экран входа ────────────────────────────────────────────────
function JoinScreen({ onEnter }) {
  const [tab, setTab] = useState("join"); // join | create
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!username.trim() || !roomCode.trim()) return setError("Заполни все поля");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/rooms/${roomCode.trim().toUpperCase()}`);
      if (!res.ok) return setError("Комната не найдена");
      const room = await res.json();
      onEnter({ username: username.trim(), room });
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!username.trim()) return setError("Введи никнейм");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName.trim() || "Без названия" }),
      });
      const room = await res.json();
      onEnter({ username: username.trim(), room });
    } catch { setError("Ошибка создания"); }
    finally { setLoading(false); }
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-logo">💬</div>
        <h1 className="join-title">AnonChat</h1>
        <p className="join-sub">Анонимный чат без регистрации</p>

        <div className="tabs">
          <button className={`tab ${tab === "join" ? "active" : ""}`} onClick={() => setTab("join")}>Войти в комнату</button>
          <button className={`tab ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>Создать комнату</button>
        </div>

        <div className="join-form">
          <input className="field" placeholder="Твой никнейм" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} />
          {tab === "join" ? (
            <input className="field code-field" placeholder="Код комнаты (напр. AB12CD)" value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={8} />
          ) : (
            <input className="field" placeholder="Название комнаты (необязательно)" value={roomName}
              onChange={e => setRoomName(e.target.value)} maxLength={60} />
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn-enter" onClick={tab === "join" ? handleJoin : handleCreate} disabled={loading}>
            {loading ? "Загрузка..." : tab === "join" ? "Войти" : "Создать и войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Экран чата ─────────────────────────────────────────────────
function ChatScreen({ username, room, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  // Загрузить историю
  useEffect(() => {
    fetch(`${API}/rooms/${room.code}/messages`)
      .then(r => r.json())
      .then(setMessages);
  }, [room.code]);

  // WebSocket
  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws/${room.code}/${encodeURIComponent(username)}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      setMessages(prev => [...prev, msg]);
    };
    return () => ws.close();
  }, [room.code, username]);

  // Автоскролл
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ text }));
    setInput("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <div className="header-left">
          <span className={`status-dot ${connected ? "online" : "offline"}`} />
          <span className="room-name">{room.name}</span>
        </div>
        <div className="header-right">
          <button className="code-badge" onClick={copyCode} title="Скопировать код">
            {copied ? "✓ Скопировано" : `# ${room.code}`}
          </button>
          <button className="btn-leave" onClick={onLeave}>Выйти</button>
        </div>
      </header>

      <div className="messages">
        {messages.map((msg, i) =>
          msg.type === "system" ? (
            <div key={i} className="sys-msg">{msg.text}</div>
          ) : (
            <div key={msg.id ?? i} className={`bubble ${msg.username === username ? "own" : "other"}`}>
              {msg.username !== username && (
                <span className="bubble-name" style={{ color: randomColor(msg.username) }}>{msg.username}</span>
              )}
              <span className="bubble-text">{msg.text}</span>
              <span className="bubble-time">{formatTime(msg.created_at)}</span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-bar">
        <input
          className="msg-input"
          placeholder="Сообщение..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          maxLength={1000}
        />
        <button className="btn-send" onClick={send} disabled={!connected}>➤</button>
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  if (!session) return <JoinScreen onEnter={setSession} />;
  return <ChatScreen username={session.username} room={session.room} onLeave={() => setSession(null)} />;
}
