import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "bookjournal-v4";

const colors = {
  bg: "#FAF7F5", card: "#FFFFFF", accent: "#C4A0D4", accentLight: "#EDE4F3",
  accentDark: "#9B72B0", accentSoft: "#F3EBF8", rose: "#E8B4B8",
  roseLight: "#FDF0F2", roseDark: "#C4848A", gold: "#D4A574",
  green: "#6BAD78", greenLight: "#E8F5EB", greenDark: "#4A8A58",
  text: "#2D2A32", textMuted: "#8A8490", textLight: "#B8B3BD",
  border: "#EDE8F0", line: "#E8E3EC", shadow: "rgba(156,114,176,0.08)",
  wish: "#A8C5D6", wishSoft: "#EDF4F8", wishDark: "#6B98B0",
  kindle: "#FF9900", kindleSoft: "#FFF5E6", kindleDark: "#CC7A00",
  club: "#E07A5F", clubSoft: "#FDF0ED", clubDark: "#B85A42", clubLight: "#F5C5B8",
};

const fonts = {
  display: "'Playfair Display','Georgia',serif",
  body: "'DM Sans','Helvetica Neue',sans-serif",
  hand: "'Caveat',cursive",
};

function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function rcolor() {
  const p = ["#C4A0D4","#E8B4B8","#A8C5D6","#D4C4A0","#B8D4A0","#D4A0A0","#A0BED4","#C4D4A0","#D4B8A0","#A0D4C4","#B0A0D4","#D4A0C4"];
  return p[Math.floor(Math.random() * p.length)];
}

const emptyBook = (year, seriesName = "") => ({
  id: rid(), title: "", author: "", genre: "", pages: "", format: "ebook",
  startDate: "", endDate: "", summary: "", rating: 0, quote: "", review: "",
  coverUrl: "", coverColor: rcolor(), status: "reading", favorite: false,
  seriesName: seriesName, seriesNumber: 0, seriesTotal: 0,
  kindleUnlimited: false, price: "",
  year: year || new Date().getFullYear(), createdAt: new Date().toISOString(),
});

const emptyWish = () => ({
  id: rid(), title: "", author: "", genre: "", note: "", coverUrl: "",
  coverColor: rcolor(), createdAt: new Date().toISOString(),
});

const statusBadge = {
  read: { label: "Lido", bg: colors.green, color: "#fff" },
  reading: { label: "Lendo", bg: "#FFFFFF", color: "#2D2A32" },
  wishlist: { label: "Wishlist", bg: colors.rose, color: "#fff" },
};

const GENRES = {
  "Ficção": ["Romance","Drama","Fantasia","Ficção Científica","Suspense","Terror","Aventura","Distopia"],
  "Não Ficção": ["Biografia","Autoajuda","Técnicos","Ensaios"],
};

function toggleGenre(cur, g) { const l = cur ? cur.split(", ").filter(Boolean) : []; const i = l.indexOf(g); if (i >= 0) l.splice(i,1); else l.push(g); return l.join(", "); }
function hasGenre(cur, g) { return cur ? cur.split(", ").includes(g) : false; }

function GenrePicker({ value, onChange, compact = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 10 }}>
      {Object.entries(GENRES).map(([group, genres]) => (
        <div key={group}>
          <span style={{ fontFamily: fonts.body, fontSize: compact ? 10 : 11, fontWeight: 700,
            color: colors.textMuted, textTransform: "uppercase", letterSpacing: .6 }}>{group}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
            {genres.map(g => {
              const a = hasGenre(value, g);
              return (<button key={g} onClick={() => onChange(toggleGenre(value, g))}
                style={{ background: a ? colors.accentSoft : "transparent",
                  border: `1.5px solid ${a ? colors.accent : colors.border}`, borderRadius: 14,
                  padding: compact ? "3px 9px" : "4px 11px", fontFamily: fonts.body, fontSize: compact ? 11 : 12,
                  color: a ? colors.accentDark : colors.textMuted, cursor: "pointer",
                  fontWeight: a ? 600 : 400, transition: "all .2s" }}>{a && "✓ "}{g}</button>);
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stars ── */
function Stars({ rating, onRate, size = 22, interactive = true }) {
  return (<div style={{ display: "flex", gap: 3 }}>{[1,2,3,4,5].map(s => (
    <span key={s} onClick={() => interactive && onRate?.(s === rating ? 0 : s)}
      style={{ fontSize: size, color: s <= rating ? colors.accent : colors.border,
        cursor: interactive ? "pointer" : "default", transition: "all .2s",
        transform: s <= rating ? "scale(1)" : "scale(.9)", userSelect: "none" }}>★</span>
  ))}</div>);
}

/* ── Cover ── */
function Cover({ book, w = 110, h = 158, radius = 8, onClick, showBadge = false, style = {} }) {
  const badge = statusBadge[book.status];
  return (
    <div onClick={onClick} style={{ width: w, height: h, borderRadius: radius, overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      boxShadow: `0 4px 16px ${colors.shadow},0 2px 4px rgba(0,0,0,.06)`,
      flexShrink: 0, position: "relative", transition: "transform .25s", ...style }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = "scale(1)")}>
      {book.coverUrl ? (
        <img src={book.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%",
          background: `linear-gradient(145deg,${book.coverColor||colors.accent},${book.coverColor||colors.accent}dd)`,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 10, textAlign: "center" }}>
          <span style={{ fontFamily: fonts.display, fontSize: Math.max(10,w/9), fontWeight: 700,
            color: "#fff", lineHeight: 1.2, textShadow: "0 1px 3px rgba(0,0,0,.2)", wordBreak: "break-word" }}>
            {book.title || "Sem título"}</span>
          {book.author && <span style={{ fontFamily: fonts.body, fontSize: Math.max(8,w/13),
            color: "rgba(255,255,255,.85)", marginTop: 4 }}>{book.author}</span>}
        </div>
      )}
      {showBadge && badge && (
        <div style={{ position: "absolute", top: 5, left: 5, display: "flex", gap: 3, alignItems: "center" }}>
          <div style={{ background: badge.bg, color: badge.color, fontSize: 8, fontFamily: fonts.body,
            fontWeight: 700, padding: "2px 6px", borderRadius: 8, letterSpacing: .4, textTransform: "uppercase",
            boxShadow: "0 1px 4px rgba(0,0,0,.15)" }}>{badge.label}</div>
          {book.favorite && (<div style={{ background: "rgba(255,255,255,.9)", width: 18, height: 18,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, boxShadow: "0 1px 3px rgba(0,0,0,.15)" }}>❤️</div>)}
        </div>
      )}
      {book.kindleUnlimited && (
        <div style={{ position: "absolute", bottom: 5, right: 5, background: colors.kindle, color: "#fff",
          fontSize: 7, fontFamily: fonts.body, fontWeight: 700, padding: "2px 5px", borderRadius: 6,
          letterSpacing: .3 }}>KU</div>
      )}
    </div>
  );
}

/* ── Series Stack Cover (realistic pile) ── */
function SeriesStack({ books, seriesName, onClick }) {
  const count = books.length;
  const total = Math.max(...books.map(b => b.seriesTotal || 0), count);

  // Sort: top of pile = currently reading, then most recently finished
  const byRelevance = [...books].sort((a, b) => {
    if (a.status === "reading" && b.status !== "reading") return 1; // reading goes last (renders on top)
    if (b.status === "reading" && a.status !== "reading") return -1;
    if (a.status === "read" && b.status === "read")
      return (a.endDate || "").localeCompare(b.endDate || "") || (a.seriesNumber || 0) - (b.seriesNumber || 0);
    return (a.seriesNumber || 0) - (b.seriesNumber || 0);
  });

  // Only show real books, up to 3
  const covers = byRelevance.slice(-3);
  const rotations = [-4, 2, 0];
  const offsets = [{ x: -4, y: 6 }, { x: 4, y: 3 }, { x: 0, y: 0 }];

  return (
    <div onClick={onClick} style={{ cursor: "pointer", textAlign: "left", width: "100%", maxWidth: 130 }}>
      <div style={{ position: "relative", width: 120, height: 170, marginBottom: 4 }}>
        {covers.map((book, i) => {
          const isTop = i === covers.length - 1;
          const rot = rotations[3 - covers.length + i] || 0;
          const off = offsets[3 - covers.length + i] || { x: 0, y: 0 };
          return (
            <div key={book.id} style={{
              position: "absolute",
              left: 5 + off.x, top: off.y,
              width: 105, height: 150, borderRadius: 6,
              overflow: "hidden",
              transform: `rotate(${rot}deg)`,
              transformOrigin: "bottom center",
              boxShadow: isTop
                ? `0 4px 16px ${colors.shadow}, 0 2px 6px rgba(0,0,0,.1)`
                : `0 2px 8px rgba(0,0,0,.08)`,
              zIndex: i + 1,
              transition: "transform .3s ease",
            }}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%",
                  background: `linear-gradient(145deg,${book.coverColor||colors.accent},${book.coverColor||colors.accent}dd)`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: 8, textAlign: "center" }}>
                  <span style={{ fontFamily: fonts.display, fontSize: 11, fontWeight: 700,
                    color: "#fff", lineHeight: 1.2, textShadow: "0 1px 2px rgba(0,0,0,.2)" }}>
                    {book.title || "?"}</span>
                </div>
              )}
              {book.seriesNumber > 0 && (
                <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,.7)",
                  color: "#fff", fontSize: 9, fontFamily: fonts.body, fontWeight: 700,
                  width: 18, height: 18, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center" }}>{book.seriesNumber}</div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: colors.text,
        lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        📚 {seriesName}
      </p>
      <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, margin: "1px 0 0" }}>
        {count}/{total} livro{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (<button onClick={onClick} style={{ background: active ? colors.accent : "transparent",
    color: active ? "#fff" : colors.textMuted, border: `1.5px solid ${active ? colors.accent : colors.border}`,
    borderRadius: 20, padding: "7px 14px", fontFamily: fonts.body, fontSize: 13,
    fontWeight: active ? 600 : 500, cursor: "pointer", transition: "all .2s",
    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>{children}</button>);
}

function FAB({ onClick, children }) {
  return (<button onClick={onClick} style={{ position: "fixed", bottom: 28, right: 28, width: 56, height: 56,
    borderRadius: "50%", background: `linear-gradient(135deg,${colors.accent},${colors.accentDark})`,
    color: "#fff", border: "none", fontSize: 28, cursor: "pointer",
    boxShadow: `0 4px 20px rgba(156,114,176,.35)`, display: "flex", alignItems: "center",
    justifyContent: "center", transition: "all .2s", zIndex: 100 }}
    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>{children}</button>);
}

/* ── Google Books Search ── */
function CoverSearch({ onSelect, onClose }) {
  const [q, setQ] = useState(""); const [results, setResults] = useState([]); const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const search = async (query) => {
    if (!query.trim()) { setResults([]); return; } setLoading(true);
    try {
      const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12&langRestrict=pt`);
      const data = await r.json();
      setResults((data.items||[]).map(i => ({ id: i.id, title: i.volumeInfo?.title||"",
        author: (i.volumeInfo?.authors||[]).join(", "),
        cover: i.volumeInfo?.imageLinks?.thumbnail?.replace("http:","https:")||"",
        pages: i.volumeInfo?.pageCount||"", genre: (i.volumeInfo?.categories||[]).join(", "),
        description: i.volumeInfo?.description||"" })).filter(i => i.cover));
    } catch(e) { console.error(e); } setLoading(false);
  };
  const handleInput = v => { setQ(v); clearTimeout(timer.current); timer.current = setTimeout(() => search(v), 500); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "bjFade .2s ease" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: colors.bg, borderRadius: "20px 20px 0 0", width: "100%",
        maxWidth: 600, maxHeight: "85vh", overflow: "hidden", display: "flex",
        flexDirection: "column", animation: "bjSlide .3s ease" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontFamily: fonts.display, fontSize: 18, fontStyle: "italic", color: colors.text, margin: 0 }}>Buscar Livro</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: colors.textMuted, cursor: "pointer" }}>✕</button>
          </div>
          <input value={q} onChange={e => handleInput(e.target.value)} autoFocus placeholder="Título ou autor..."
            style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${colors.border}`,
              background: colors.card, fontFamily: fonts.body, fontSize: 15, color: colors.text, outline: "none" }}
            onFocus={e => e.target.style.borderColor = colors.accent} onBlur={e => e.target.style.borderColor = colors.border} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading && <p style={{ textAlign: "center", color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 }}>Buscando...</p>}
          {!loading && !results.length && q && <p style={{ textAlign: "center", color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 }}>Nenhum resultado</p>}
          {!loading && !q && <p style={{ textAlign: "center", color: colors.textLight, fontFamily: fonts.body, fontSize: 13, paddingTop: 20 }}>🔍 Busque por título ou autor</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12 }}>
            {results.map(r => (
              <div key={r.id} onClick={() => onSelect(r)}
                style={{ cursor: "pointer", textAlign: "center", padding: 8, borderRadius: 10,
                  border: `1px solid ${colors.border}`, background: colors.card, transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.background = colors.accentSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.card; }}>
                <img src={r.cover} alt="" style={{ width: 75, height: 108, objectFit: "cover", borderRadius: 6,
                  boxShadow: `0 2px 8px ${colors.shadow}` }} />
                <p style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: colors.text,
                  marginTop: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{r.title}</p>
                <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, margin: 0 }}>{r.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Share Recommendations Card ── */
function ShareCard({ books, onClose }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const shareText = `📚 Livros que eu recomendo:\n\n${books.map((b, i) =>
    `${i + 1}. "${b.title}" — ${b.author}${b.rating ? " (" + "★".repeat(b.rating) + ")" : ""}`
  ).join("\n")}\n\n— Feito com Book Journal ❤️`;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Meus livros recomendados", text: shareText }); }
      catch (e) { if (e.name !== "AbortError") console.error(e); }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      animation: "bjFade .2s ease" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div ref={cardRef} style={{ background: `linear-gradient(135deg, ${colors.bg}, ${colors.accentSoft})`,
        borderRadius: 20, padding: 24, maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "bjFade .3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.text,
            margin: 0, fontStyle: "italic" }}>
            <span style={{ color: colors.accent }}>Eu</span> Recomendo ❤️
          </h3>
          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, margin: "4px 0 0" }}>
            {books.length} livro{books.length !== 1 ? "s" : ""} que valem a leitura
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          {books.slice(0, 8).map(b => (
            <div key={b.id} style={{ textAlign: "center", width: 72 }}>
              <Cover book={b} w={65} h={93} radius={6} />
              <p style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, marginTop: 3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</p>
            </div>
          ))}
          {books.length > 8 && (
            <div style={{ width: 65, height: 93, borderRadius: 6, background: colors.accentLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.accentDark }}>
              +{books.length - 8}
            </div>
          )}
        </div>

        {/* Book list */}
        <div style={{ background: "rgba(255,255,255,.7)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          {books.slice(0, 10).map((b, i) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
              borderBottom: i < Math.min(books.length, 10) - 1 ? `1px solid ${colors.border}` : "none" }}>
              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textLight, width: 16, textAlign: "right" }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.text }}>
                  {b.title}</span>
                <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted }}> — {b.author}</span>
              </div>
              <Stars rating={b.rating} size={10} interactive={false} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleShare}
            style={{ flex: 1, background: `linear-gradient(135deg,${colors.accent},${colors.accentDark})`,
              color: "#fff", border: "none", borderRadius: 16, padding: "11px 0",
              fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📤 Compartilhar
          </button>
          <button onClick={handleCopy}
            style={{ flex: 1, background: colors.card, color: colors.text,
              border: `1.5px solid ${colors.border}`, borderRadius: 16, padding: "11px 0",
              fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✓ Copiado!" : "📋 Copiar lista"}
          </button>
        </div>

        <button onClick={onClose} style={{ display: "block", margin: "12px auto 0", background: "none",
          border: "none", color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>Fechar</button>
      </div>
    </div>
  );
}

/* ── LIBRARY VIEW ── */
function LibraryView({ books, onSelect, onSelectSeries, filter, setFilter }) {
  const [showShare, setShowShare] = useState(false);
  const sorted = [...books].sort((a, b) => {
    if (a.status === "reading" && b.status !== "reading") return -1;
    if (b.status === "reading" && a.status !== "reading") return 1;
    if (a.status === "reading" && b.status === "reading")
      return (b.startDate||"").localeCompare(a.startDate||"") || new Date(b.createdAt) - new Date(a.createdAt);
    if (a.status === "read" && b.status === "read")
      return (b.endDate||"").localeCompare(a.endDate||"") || new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filtered = sorted.filter(b => {
    if (filter === "all") return true;
    if (filter === "read") return b.status === "read";
    if (filter === "reading") return b.status === "reading";
    if (filter === "favorites") return b.favorite;
    if (filter === "ku") return b.kindleUnlimited;
    return true;
  });

  // Group by series
  const seriesMap = {};
  const standalone = [];
  filtered.forEach(b => {
    if (b.seriesName) {
      if (!seriesMap[b.seriesName]) seriesMap[b.seriesName] = [];
      seriesMap[b.seriesName].push(b);
    } else {
      standalone.push(b);
    }
  });

  // Build display items in order of first appearance
  const displayed = [];
  const seriesSeen = new Set();
  filtered.forEach(b => {
    if (b.seriesName) {
      if (!seriesSeen.has(b.seriesName)) {
        seriesSeen.add(b.seriesName);
        displayed.push({ type: "series", name: b.seriesName, books: seriesMap[b.seriesName] });
      }
    } else {
      displayed.push({ type: "book", book: b });
    }
  });

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 18, scrollbarWidth: "none" }}>
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>📚 Todos ({books.length})</Pill>
        <Pill active={filter === "reading"} onClick={() => setFilter("reading")}>📖 Lendo</Pill>
        <Pill active={filter === "read"} onClick={() => setFilter("read")}>✅ Lidos</Pill>
        <Pill active={filter === "favorites"} onClick={() => setFilter("favorites")}>💜 Eu Recomendo</Pill>
        <Pill active={filter === "ku"} onClick={() => setFilter("ku")}>📱 KU</Pill>
      </div>

      {/* Share button for recommendations */}
      {filter === "favorites" && filtered.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setShowShare(true)}
            style={{ background: `linear-gradient(135deg,${colors.accent},${colors.accentDark})`,
              color: "#fff", border: "none", borderRadius: 16, padding: "8px 16px",
              fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              boxShadow: `0 3px 10px rgba(156,114,176,.3)` }}>
            📤 Compartilhar recomendações
          </button>
        </div>
      )}
      {displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textMuted, fontFamily: fonts.body }}>
          <div style={{ fontSize: 42, marginBottom: 12, opacity: .4 }}>📚</div>
          <p style={{ fontSize: 15 }}>{filter === "all" ? "Nenhum livro neste ano ainda" : "Nenhum livro nesta categoria"}</p>
          <p style={{ fontSize: 12, color: colors.textLight }}>Toque no + para adicionar</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 18, justifyItems: "center" }}>
          {displayed.map((item, idx) => {
            if (item.type === "series") {
              return <SeriesStack key={item.name} books={item.books} seriesName={item.name}
                onClick={() => onSelectSeries(item.name)} />;
            }
            const book = item.book;
            return (
              <div key={book.id} style={{ textAlign: "left", width: "100%", maxWidth: 130 }}>
                <Cover book={book} onClick={() => onSelect(book)} showBadge={true} />
                <div style={{ marginTop: 6 }}><Stars rating={book.rating} size={13} interactive={false} /></div>
                <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title || "Sem título"}</p>
              </div>
            );
          })}
        </div>
      )}

      {showShare && <ShareCard books={filtered} onClose={() => setShowShare(false)} />}
    </div>
  );
}

/* ── SERIES VIEW ── */
function SeriesView({ seriesName, books, onSelectBook, onAddBook, onBack }) {
  const sorted = [...books].sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0));
  const total = Math.max(...books.map(b => b.seriesTotal || 0), books.length);
  const readCount = books.filter(b => b.status === "read").length;

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 700, margin: "0 auto", animation: "bjFade .3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 14, color: colors.accent,
        cursor: "pointer", fontFamily: fonts.body, fontWeight: 600, padding: "8px 0", marginBottom: 16 }}>← Biblioteca</button>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: colors.text, margin: 0, fontStyle: "italic" }}>
          📚 {seriesName}
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, margin: "4px 0 0" }}>
          {books.length} de {total} livro{total !== 1 ? "s" : ""} • {readCount} lido{readCount !== 1 ? "s" : ""}
        </p>
        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: colors.accentLight, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(readCount / total) * 100}%`,
            background: `linear-gradient(90deg,${colors.green},${colors.greenDark})`, borderRadius: 3, transition: "width .5s" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 16, marginBottom: 24 }}>
        {sorted.map(book => (
          <div key={book.id} onClick={() => onSelectBook(book)}
            style={{ cursor: "pointer", textAlign: "left" }}>
            <div style={{ position: "relative" }}>
              <Cover book={book} showBadge={true} />
              {book.seriesNumber > 0 && (
                <div style={{ position: "absolute", bottom: -4, left: -4, background: colors.text,
                  color: "#fff", fontSize: 10, fontFamily: fonts.body, fontWeight: 700,
                  width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>{book.seriesNumber}</div>
              )}
            </div>
            <div style={{ marginTop: 6 }}><Stars rating={book.rating} size={13} interactive={false} /></div>
            <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title || "Sem título"}</p>
          </div>
        ))}

        {/* Add book to series */}
        <div onClick={onAddBook}
          style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", width: 110, height: 158, borderRadius: 8,
            border: `2px dashed ${colors.border}`, background: colors.card, transition: "all .2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
          <span style={{ fontSize: 28, color: colors.textLight }}>+</span>
          <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Adicionar</span>
        </div>
      </div>
    </div>
  );
}

/* ── WISHLIST VIEW ── */
function WishlistView({ wishes, onUpdate, onAdd, onDelete, onStartReading }) {
  const [editingId, setEditingId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const fileRefs = useRef({});

  const moveItem = (i, d) => { const n = i+d; if (n<0||n>=wishes.length) return; const a=[...wishes]; [a[i],a[n]]=[a[n],a[i]]; onUpdate(a); };
  const updateWish = (id, f, v) => onUpdate(wishes.map(w => w.id === id ? { ...w, [f]: v } : w));
  const handleCoverUpload = (wid, e) => { const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => updateWish(wid, "coverUrl", ev.target.result); r.readAsDataURL(f); };
  const handleSearchSelect = (r) => { const w = emptyWish(); w.title=r.title; w.author=r.author; w.genre=r.genre; w.coverUrl=r.cover; onUpdate([...wishes,w]); setShowSearch(false); };

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 650, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text, margin: 0, fontStyle: "italic" }}>📋 Minha Wishlist</h2>
          <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, margin: "2px 0 0" }}>
            {wishes.length} livro{wishes.length !== 1 ? "s" : ""} • use as setas para reorganizar</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSearch(true)} style={{ background: colors.wishSoft, border: `1.5px solid ${colors.wish}`,
            borderRadius: 18, padding: "7px 14px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.wishDark, cursor: "pointer" }}>🔍 Buscar</button>
          <button onClick={onAdd} style={{ background: `linear-gradient(135deg,${colors.wish},${colors.wishDark})`,
            border: "none", borderRadius: 18, padding: "7px 14px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>+ Manual</button>
        </div>
      </div>
      {wishes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textMuted, fontFamily: fonts.body }}>
          <div style={{ fontSize: 42, marginBottom: 12, opacity: .4 }}>📋</div>
          <p style={{ fontSize: 15 }}>Sua wishlist está vazia</p>
          <p style={{ fontSize: 12, color: colors.textLight }}>Pare de salvar no Instagram! Adicione aqui 😉</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {wishes.map((wish, i) => {
            const isE = editingId === wish.id;
            return (
              <div key={wish.id} style={{ background: colors.card, borderRadius: 14, padding: 14,
                border: `1.5px solid ${colors.border}`, display: "flex", gap: 12, alignItems: "flex-start", transition: "all .2s" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveItem(i,-1)} disabled={i===0} style={{ background: "none", border: "none", fontSize: 14,
                    cursor: i===0?"default":"pointer", color: i===0?colors.border:colors.textMuted, padding: "2px 4px", lineHeight: 1 }}>▲</button>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: colors.wishSoft, display: "flex",
                    alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontSize: 13, fontWeight: 700, color: colors.wishDark }}>{i+1}</div>
                  <button onClick={() => moveItem(i,1)} disabled={i===wishes.length-1} style={{ background: "none", border: "none", fontSize: 14,
                    cursor: i===wishes.length-1?"default":"pointer", color: i===wishes.length-1?colors.border:colors.textMuted, padding: "2px 4px", lineHeight: 1 }}>▼</button>
                </div>
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <Cover book={wish} w={55} h={80} radius={6} />
                  <input ref={el => fileRefs.current[wish.id]=el} type="file" accept="image/*" onChange={e => handleCoverUpload(wish.id,e)} style={{ display: "none" }} />
                  {isE && <button onClick={() => fileRefs.current[wish.id]?.click()} style={{ marginTop: 4, background: "none", border: "none",
                    fontSize: 9, color: colors.accent, cursor: "pointer", fontFamily: fonts.body, fontWeight: 600 }}>📷 Capa</button>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isE ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input value={wish.title} onChange={e => updateWish(wish.id,"title",e.target.value)} placeholder="Título"
                        style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, border: "none", borderBottom: `1px solid ${colors.border}`,
                          padding: "3px 0", outline: "none", background: "transparent", color: colors.text }} />
                      <input value={wish.author||""} onChange={e => updateWish(wish.id,"author",e.target.value)} placeholder="Autor"
                        style={{ fontFamily: fonts.body, fontSize: 12, border: "none", borderBottom: `1px solid ${colors.border}`,
                          padding: "3px 0", outline: "none", background: "transparent", color: colors.textMuted }} />
                      <div style={{ marginTop: 4 }}><GenrePicker value={wish.genre} onChange={v => updateWish(wish.id,"genre",v)} compact={true} /></div>
                      <textarea value={wish.note} onChange={e => updateWish(wish.id,"note",e.target.value)}
                        placeholder="Anotação (sobre o que é, quem indicou, por que quer ler...)"
                        style={{ fontFamily: fonts.hand, fontSize: 15, border: `1px solid ${colors.border}`, borderRadius: 8,
                          padding: 8, outline: "none", background: colors.accentSoft, color: colors.text, minHeight: 50, resize: "vertical" }} />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => onDelete(wish.id)} style={{ background: "none", border: "none", color: "#d45", fontSize: 11, fontFamily: fonts.body, cursor: "pointer" }}>Excluir</button>
                        <button onClick={() => setEditingId(null)} style={{ background: colors.wish, color: "#fff", border: "none", borderRadius: 12,
                          padding: "5px 14px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                    <div onClick={() => setEditingId(wish.id)} style={{ cursor: "pointer" }}>
                      <p style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.text, margin: 0, lineHeight: 1.3 }}>{wish.title||"Sem título"}</p>
                      {wish.author && <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>{wish.author}</p>}
                      {wish.genre && (<div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                        {wish.genre.split(", ").filter(Boolean).map(g => (
                          <span key={g} style={{ display: "inline-block", background: colors.wishSoft, color: colors.wishDark,
                            fontSize: 10, fontFamily: fonts.body, fontWeight: 600, padding: "2px 8px", borderRadius: 8 }}>{g}</span>))}
                      </div>)}
                      {wish.note && <p style={{ fontFamily: fonts.hand, fontSize: 14, color: colors.textMuted, margin: "5px 0 0", lineHeight: 1.3, fontStyle: "italic" }}>"{wish.note}"</p>}
                    </div>
                    <button onClick={() => onStartReading(wish)}
                      style={{ marginTop: 8, background: `linear-gradient(135deg,${colors.accent},${colors.accentDark})`,
                        color: "#fff", border: "none", borderRadius: 12, padding: "5px 14px",
                        fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4 }}>
                      📖 Começar a ler
                    </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showSearch && <CoverSearch onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}
    </div>
  );
}

/* ── REVIEW PAGE ── */
function ReviewPage({ book, onUpdate, onDelete, onBack, allBooks, backLabel = "← Biblioteca" }) {
  const [b, setB] = useState({ ...book });
  const [showDelete, setShowDelete] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const set = (field, val) => { const u = { ...b, [field]: val }; setB(u); onUpdate(u); };
  const handleSearchSelect = (r) => {
    const u = { ...b, coverUrl: r.cover, title: r.title||b.title, author: r.author||b.author,
      pages: r.pages||b.pages, genre: r.genre||b.genre, summary: r.description ? r.description.slice(0,300) : b.summary };
    setB(u); onUpdate(u); setShowSearch(false);
  };
  const handleFile = e => { const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => set("coverUrl", ev.target.result); r.readAsDataURL(f); };

  // Find existing series for autocomplete
  const existingSeries = [...new Set((allBooks||[]).filter(x => x.seriesName).map(x => x.seriesName))];

  const inp = { fontFamily: fonts.body, fontSize: 14, color: colors.text, border: "none",
    borderBottom: `1px solid ${colors.border}`, background: "transparent", padding: "6px 0", width: "100%", outline: "none" };
  const lbl = { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: .8, marginBottom: 2, display: "block" };

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 700, margin: "0 auto", animation: "bjFade .3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 14, color: colors.accent,
        cursor: "pointer", fontFamily: fonts.body, fontWeight: 600, padding: "8px 0", marginBottom: 16 }}>{backLabel}</button>

      {/* Title + Favorite */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.text, margin: 0, fontStyle: "italic" }}>Review</h2>
        <button onClick={() => set("favorite", !b.favorite)}
          style={{ background: b.favorite ? colors.roseLight : "transparent",
            border: `1.5px solid ${b.favorite ? colors.rose : colors.border}`, borderRadius: 20,
            padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            transition: "all .25s", fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
            color: b.favorite ? colors.roseDark : colors.textMuted }}>
          <span style={{ fontSize: 16, transition: "transform .25s", transform: b.favorite ? "scale(1.15)" : "scale(1)" }}>
            {b.favorite ? "❤️" : "🤍"}</span>{b.favorite ? "Recomendo" : "Recomendar"}
        </button>
      </div>

      {/* Cover + Details */}
      <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <Cover book={b} w={180} h={258} radius={12} showBadge={true} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => setShowSearch(true)} style={{ background: colors.accentSoft, border: `1px solid ${colors.border}`,
              borderRadius: 14, padding: "5px 12px", fontFamily: fonts.body, fontSize: 11, color: colors.accentDark, cursor: "pointer", fontWeight: 500 }}>🔍 Buscar capa</button>
            <button onClick={() => fileRef.current?.click()} style={{ background: colors.accentSoft, border: `1px solid ${colors.border}`,
              borderRadius: 14, padding: "5px 12px", fontFamily: fonts.body, fontSize: 11, color: colors.accentDark, cursor: "pointer", fontWeight: 500 }}>📷 Upload</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Título</label>
            <input value={b.title} onChange={e => set("title",e.target.value)} placeholder="Nome do livro"
              style={{ ...inp, fontFamily: fonts.display, fontSize: 18, fontWeight: 600 }}
              onFocus={e => e.target.style.borderColor=colors.accent} onBlur={e => e.target.style.borderColor=colors.border} /></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Autor</label>
            <input value={b.author} onChange={e => set("author",e.target.value)} placeholder="Autor(a)" style={inp}
              onFocus={e => e.target.style.borderColor=colors.accent} onBlur={e => e.target.style.borderColor=colors.border} /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Gênero</label>
            <div style={{ marginTop: 6 }}><GenrePicker value={b.genre} onChange={v => set("genre",v)} /></div></div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}><label style={lbl}>Nº de páginas</label>
              <input value={b.pages} onChange={e => set("pages",e.target.value)} placeholder="368" type="number" style={inp}
                onFocus={e => e.target.style.borderColor=colors.accent} onBlur={e => e.target.style.borderColor=colors.border} /></div>
            <div style={{ flex: 1 }}><label style={lbl}>Status</label>
              <select value={b.status} onChange={e => set("status",e.target.value)}
                style={{ ...inp, appearance: "none", cursor: "pointer",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238A8490' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center", paddingRight: 20 }}>
                <option value="reading">📖 Lendo</option><option value="read">✅ Lido</option><option value="wishlist">📋 Wishlist</option>
              </select></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Formato</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {[{v:"physical",l:"Físico",i:"📕"},{v:"ebook",l:"E-book",i:"📱"},{v:"audiobook",l:"Audiobook",i:"🎧"}].map(f => (
                <button key={f.v} onClick={() => set("format",f.v)} style={{ background: b.format===f.v ? colors.accentSoft : "transparent",
                  border: `1.5px solid ${b.format===f.v ? colors.accent : colors.border}`, borderRadius: 14,
                  padding: "5px 12px", fontFamily: fonts.body, fontSize: 12, color: b.format===f.v ? colors.accentDark : colors.textMuted,
                  cursor: "pointer", fontWeight: b.format===f.v ? 600 : 400, transition: "all .2s" }}>{f.i} {f.l}</button>))}
            </div></div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}><label style={lbl}>Início</label>
              <input type="date" value={b.startDate} onChange={e => set("startDate",e.target.value)} style={inp} /></div>
            <div style={{ flex: 1 }}><label style={lbl}>Término</label>
              <input type="date" value={b.endDate} onChange={e => set("endDate",e.target.value)} style={inp} /></div>
          </div>
          {/* Day counter */}
          {b.startDate && (() => {
            const start = new Date(b.startDate);
            const end = b.endDate ? new Date(b.endDate) : new Date();
            const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
            const isReading = !b.endDate || b.status === "reading";
            return (
              <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10,
                background: isReading ? colors.accentSoft : colors.greenLight,
                display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{isReading ? "⏱️" : "✅"}</span>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                  color: isReading ? colors.accentDark : colors.greenDark }}>
                  {isReading ? `Lendo há ${days} dia${days !== 1 ? "s" : ""}` : `Lido em ${days} dia${days !== 1 ? "s" : ""}`}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
      <div style={{ background: colors.card, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${colors.border}` }}>
        <label style={{ ...lbl, marginBottom: 10 }}>📚 Série</label>
        <div style={{ marginBottom: 8 }}>
          <input value={b.seriesName} onChange={e => set("seriesName",e.target.value)} placeholder="Nome da série (vazio = livro avulso)"
            list="series-list" style={inp}
            onFocus={e => e.target.style.borderColor=colors.accent} onBlur={e => e.target.style.borderColor=colors.border} />
          <datalist id="series-list">{existingSeries.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        {b.seriesName && (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}><label style={{ ...lbl, fontSize: 10 }}>Nº deste livro</label>
              <input type="number" value={b.seriesNumber||""} onChange={e => set("seriesNumber",parseInt(e.target.value)||0)}
                placeholder="1" style={inp} min="1" /></div>
            <div style={{ flex: 1 }}><label style={{ ...lbl, fontSize: 10 }}>Total da série</label>
              <input type="number" value={b.seriesTotal||""} onChange={e => set("seriesTotal",parseInt(e.target.value)||0)}
                placeholder="3" style={inp} min="1" /></div>
          </div>
        )}
      </div>

      {/* Kindle Unlimited + Price */}
      <div style={{ background: b.kindleUnlimited ? colors.kindleSoft : colors.card, borderRadius: 12,
        padding: 16, marginBottom: 20, border: `1px solid ${b.kindleUnlimited ? colors.kindle : colors.border}`,
        transition: "all .3s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: b.kindleUnlimited || b.price ? 12 : 0 }}>
          <label style={{ ...lbl, margin: 0 }}>💰 Valor e Assinatura</label>
          <button onClick={() => set("kindleUnlimited", !b.kindleUnlimited)}
            style={{ background: b.kindleUnlimited ? colors.kindle : "transparent",
              border: `1.5px solid ${b.kindleUnlimited ? colors.kindle : colors.border}`,
              borderRadius: 14, padding: "4px 12px", fontFamily: fonts.body, fontSize: 11,
              fontWeight: 700, color: b.kindleUnlimited ? "#fff" : colors.textMuted,
              cursor: "pointer", transition: "all .2s" }}>
            {b.kindleUnlimited ? "✓ Kindle Unlimited" : "Kindle Unlimited"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...lbl, fontSize: 10 }}>Preço do livro (R$)</label>
            <input type="number" value={b.price||""} onChange={e => set("price",e.target.value)}
              placeholder="29.90" step="0.01" min="0" style={inp}
              onFocus={e => e.target.style.borderColor=colors.accent} onBlur={e => e.target.style.borderColor=colors.border} />
          </div>
          {b.kindleUnlimited && (
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
              <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.kindleDark, margin: 0 }}>
                ✨ Você economizou {b.price ? `R$ ${parseFloat(b.price).toFixed(2)}` : "—"} com KU
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: colors.card, borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${colors.border}` }}>
        <label style={{ ...lbl, marginBottom: 8 }}>Sumário</label>
        <textarea value={b.summary} onChange={e => set("summary",e.target.value)} placeholder="Breve resumo do livro..."
          style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, border: "none", background: "transparent",
            width: "100%", minHeight: 60, resize: "vertical", outline: "none", lineHeight: 1.6 }} />
      </div>

      {/* Rating */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24, padding: "14px 0" }}>
        <span style={{ fontFamily: fonts.display, fontSize: 15, color: colors.textMuted, fontStyle: "italic" }}>Avaliação</span>
        <Stars rating={b.rating} onRate={r => set("rating",r)} size={30} />
      </div>

      {/* Quote */}
      <div style={{ background: colors.accentSoft, borderRadius: 12, padding: 20, marginBottom: 24, borderLeft: `3px solid ${colors.accent}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 24, color: colors.accent, fontFamily: "serif" }}>❝</span>
          <label style={{ fontFamily: fonts.display, fontSize: 15, color: colors.accentDark, fontStyle: "italic", fontWeight: 600 }}>Citação Favorita</label>
        </div>
        <textarea value={b.quote} onChange={e => set("quote",e.target.value)} placeholder="A frase que mais te impactou..."
          style={{ fontFamily: fonts.hand, fontSize: 18, color: colors.text, border: "none", background: "transparent",
            width: "100%", minHeight: 50, resize: "vertical", outline: "none", lineHeight: 1.5 }} />
        <div style={{ textAlign: "right" }}><span style={{ fontSize: 24, color: colors.accent, fontFamily: "serif" }}>❞</span></div>
      </div>

      {/* Review text */}
      <div style={{ background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 24 }}>
        <label style={{ fontFamily: fonts.display, fontSize: 18, color: colors.text, fontStyle: "italic", fontWeight: 600, display: "block", marginBottom: 12 }}>Review</label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0,
            backgroundImage: `repeating-linear-gradient(transparent,transparent 31px,${colors.line} 31px,${colors.line} 32px)`,
            backgroundSize: "100% 32px", opacity: .5, pointerEvents: "none" }} />
          <textarea value={b.review} onChange={e => set("review",e.target.value)} placeholder="O que você achou do livro?"
            style={{ fontFamily: fonts.hand, fontSize: 18, color: colors.text, border: "none", background: "transparent",
              width: "100%", minHeight: 250, resize: "vertical", outline: "none", lineHeight: "32px", padding: 0, position: "relative" }} />
        </div>
      </div>

      {/* Save & Delete */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 12 }}>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1500); onBack(); }}
          style={{ background: `linear-gradient(135deg,${colors.accent},${colors.accentDark})`,
            color: "#fff", border: "none", borderRadius: 20, padding: "12px 36px",
            fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 3px 12px rgba(156,114,176,.3)`, transition: "all .2s", width: "100%", maxWidth: 280 }}
          onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
          ✓ Salvar livro
        </button>
        {showDelete ? (
          <div style={{ background: colors.roseLight, border: `1px solid ${colors.rose}`, borderRadius: 12,
            padding: 16, display: "inline-flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, margin: 0 }}>Excluir este livro?</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { onDelete(b.id); onBack(); }} style={{ background: "#E05555", color: "#fff", border: "none",
                borderRadius: 14, padding: "7px 20px", fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sim</button>
              <button onClick={() => setShowDelete(false)} style={{ background: "transparent", color: colors.textMuted,
                border: `1px solid ${colors.border}`, borderRadius: 14, padding: "7px 20px", fontFamily: fonts.body, fontSize: 13, cursor: "pointer" }}>Não</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDelete(true)} style={{ background: "none", border: "none", color: colors.textLight,
            fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>🗑 Excluir livro</button>
        )}
      </div>
      {showSearch && <CoverSearch onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}
    </div>
  );
}

/* ── STATS VIEW ── */
function StatsView({ books }) {
  const read = books.filter(b => b.status==="read").length;
  const reading = books.filter(b => b.status==="reading").length;
  const totalPages = books.reduce((s,b) => s+(parseInt(b.pages)||0), 0);
  const rated = books.filter(b => b.rating>0);
  const avg = rated.length ? (rated.reduce((s,b) => s+b.rating,0)/rated.length).toFixed(1) : "—";
  const gc = {}; books.forEach(b => { if (b.genre) b.genre.split(", ").filter(Boolean).forEach(g => { const k=g.toLowerCase(); gc[k]=(gc[k]||0)+1; }); });
  const topG = Object.entries(gc).sort((a,b) => b[1]-a[1]).slice(0,5);
  const fc = { physical:0, ebook:0, audiobook:0 }; books.forEach(b => { if (b.format) fc[b.format]++; });

  // KU stats
  const kuBooks = books.filter(b => b.kindleUnlimited);
  const kuSavings = kuBooks.reduce((s,b) => s+(parseFloat(b.price)||0), 0);
  const kuCount = kuBooks.length;

  const card = (icon,label,val,clr) => (
    <div style={{ background: colors.card, borderRadius: 14, padding: "16px 14px", border: `1px solid ${colors.border}`, textAlign: "center", flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: clr||colors.text }}>{val}</div>
      <div style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: .6, marginTop: 3 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: 20, fontStyle: "italic" }}>📊 Estatísticas do Ano</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {card("📚","Total",books.length,colors.accent)}{card("✅","Lidos",read,colors.green)}{card("📖","Lendo",reading,colors.gold)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {card("📄","Páginas",totalPages.toLocaleString())}{card("⭐","Média",avg,colors.gold)}
      </div>

      {/* KU Savings */}
      {kuCount > 0 && (
        <div style={{ background: colors.kindleSoft, borderRadius: 14, padding: 18, border: `1px solid ${colors.kindle}`, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>📱</span>
            <h3 style={{ fontFamily: fonts.display, fontSize: 16, color: colors.kindleDark, margin: 0, fontStyle: "italic" }}>Kindle Unlimited</h3>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700, color: colors.kindle }}>{kuCount}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 10, color: colors.kindleDark, textTransform: "uppercase" }}>Livros KU</div>
            </div>
            <div style={{ width: 1, height: 40, background: colors.kindle, opacity: .3 }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700, color: colors.green }}>
                R$ {kuSavings.toFixed(2)}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 10, color: colors.greenDark, textTransform: "uppercase" }}>Economia total</div>
            </div>
          </div>
          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.kindleDark, marginTop: 10, textAlign: "center", opacity: .8 }}>
            {kuSavings >= 30 ? "✨ Sua assinatura está valendo a pena!" : "💡 Assinatura KU custa ~R$30/mês. Leia mais para compensar!"}
          </p>
        </div>
      )}

      {topG.length > 0 && (
        <div style={{ background: colors.card, borderRadius: 14, padding: 18, border: `1px solid ${colors.border}`, marginBottom: 18 }}>
          <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.text, marginBottom: 12, fontStyle: "italic" }}>Gêneros mais lidos</h3>
          {topG.map(([g,c],i) => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, width: 18, textAlign: "right" }}>{i+1}.</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, textTransform: "capitalize", marginBottom: 3 }}>{g}</div>
                <div style={{ height: 5, borderRadius: 3, background: colors.accentLight, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(c/topG[0][1])*100}%`, background: `linear-gradient(90deg,${colors.accent},${colors.accentDark})`, borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, fontWeight: 600 }}>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reading Speed */}
      {(() => {
        const booksWithDays = books.filter(b => b.status === "read" && b.startDate && b.endDate).map(b => {
          const days = Math.max(1, Math.round((new Date(b.endDate) - new Date(b.startDate)) / (1000*60*60*24)));
          return { ...b, days };
        });
        if (!booksWithDays.length) return null;
        const avgDays = Math.round(booksWithDays.reduce((s, b) => s + b.days, 0) / booksWithDays.length);
        const fastest = booksWithDays.reduce((a, b) => a.days < b.days ? a : b);
        const slowest = booksWithDays.reduce((a, b) => a.days > b.days ? a : b);

        // Average by genre
        const genreDays = {};
        booksWithDays.forEach(b => {
          if (b.genre) b.genre.split(", ").filter(Boolean).forEach(g => {
            if (!genreDays[g]) genreDays[g] = [];
            genreDays[g].push(b.days);
          });
        });
        const genreAvg = Object.entries(genreDays).map(([g, ds]) => ({
          genre: g, avg: Math.round(ds.reduce((s, d) => s + d, 0) / ds.length), count: ds.length
        })).sort((a, b) => a.avg - b.avg);

        return (
          <div style={{ background: colors.card, borderRadius: 14, padding: 18, border: `1px solid ${colors.border}`, marginBottom: 18 }}>
            <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.text, marginBottom: 12, fontStyle: "italic" }}>⏱️ Velocidade de leitura</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, textAlign: "center", background: colors.accentSoft, borderRadius: 10, padding: 10 }}>
                <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.accent }}>{avgDays}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, textTransform: "uppercase" }}>Média de dias</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: colors.greenLight, borderRadius: 10, padding: 10 }}>
                <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.green }}>{fastest.days}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, textTransform: "uppercase" }}>Mais rápido</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: colors.roseLight, borderRadius: 10, padding: 10 }}>
                <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.roseDark }}>{slowest.days}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, textTransform: "uppercase" }}>Mais lento</div>
              </div>
            </div>
            {genreAvg.length > 1 && (
              <>
                <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Média por gênero</p>
                {genreAvg.map(g => (
                  <div key={g.genre} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text, flex: 1 }}>{g.genre}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontFamily: fonts.display, fontSize: 14, fontWeight: 700, color: colors.accent }}>{g.avg}</span>
                      <span style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted }}>dias</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })()}

      <div style={{ background: colors.card, borderRadius: 14, padding: 18, border: `1px solid ${colors.border}` }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.text, marginBottom: 12, fontStyle: "italic" }}>Formato de leitura</h3>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          {[{k:"physical",l:"Físico",i:"📕"},{k:"ebook",l:"E-book",i:"📱"},{k:"audiobook",l:"Audiobook",i:"🎧"}].map(f => (
            <div key={f.k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 3 }}>{f.i}</div>
              <div style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 700, color: colors.text }}>{fc[f.k]}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted }}>{f.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── BOOK CLUB ── */
const MOODS = [
  { emoji: "😍", label: "Amando" }, { emoji: "😊", label: "Gostando" },
  { emoji: "🤔", label: "Pensativa" }, { emoji: "😢", label: "Emocionada" },
  { emoji: "😱", label: "Chocada" }, { emoji: "😴", label: "Entediada" },
  { emoji: "🤯", label: "Mind blown" }, { emoji: "🥰", label: "Apaixonada" },
];

function BookClubView() {
  const [profile, setProfile] = useState(null);
  const [club, setClub] = useState({ currentBook: null, members: {}, updates: [] });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("feed"); // feed | members | setbook
  const [newUpdate, setNewUpdate] = useState({ page: "", mood: "", comment: "", rating: 0 });
  const [showPost, setShowPost] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: "", photo: "" });
  const [bookDraft, setBookDraft] = useState({ title: "", author: "", coverUrl: "", pages: "", genre: "" });
  const [showSearch, setShowSearch] = useState(false);
  const fileRef = useRef(null);
  const profileFileRef = useRef(null);
  const [showAddNom, setShowAddNom] = useState(false);
  const [nomDraft, setNomDraft] = useState({ title: "", author: "", coverUrl: "", genre: "" });
  const [showNomSearch, setShowNomSearch] = useState(false);
  const [showWishPick, setShowWishPick] = useState(false);
  const [myWishes, setMyWishes] = useState([]);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const p = await window.storage.get("bookclub-profile");
        if (p?.value) { const pd = JSON.parse(p.value); setProfile(pd); setProfileDraft(pd); }
      } catch(e) {}
      try {
        const c = await window.storage.get("bookclub-state", true);
        if (c?.value) setClub(JSON.parse(c.value));
      } catch(e) {}
      setLoaded(true);
    })();
  }, []);

  // Load personal wishlist for nominations
  useEffect(() => {
    if (!showWishPick) return;
    (async () => {
      try {
        const r = await window.storage.get("bookjournal-v4");
        if (r?.value) { const d = JSON.parse(r.value); setMyWishes(d.wishes || []); }
      } catch(e) {}
    })();
  }, [showWishPick]);

  const saveProfile = async (p) => {
    setProfile(p); setProfileDraft(p);
    try { await window.storage.set("bookclub-profile", JSON.stringify(p)); } catch(e) {}
    // Also update in shared members
    const updated = { ...club, members: { ...club.members, [p.id]: { name: p.name, photo: p.photo, joinedAt: p.joinedAt || new Date().toISOString() } } };
    setClub(updated);
    try { await window.storage.set("bookclub-state", JSON.stringify(updated), true); } catch(e) {}
  };

  const saveClub = async (c) => {
    setClub(c);
    try { await window.storage.set("bookclub-state", JSON.stringify(c), true); } catch(e) {}
  };

  const handleSetBook = async () => {
    if (!bookDraft.title) return;
    const month = new Date().toISOString().slice(0, 7);
    // Save current book to history before replacing
    const history = [...(club.history || [])];
    if (club.currentBook) {
      const bookRatings = (club.ratings || {})[club.currentBook.month] || {};
      history.push({ ...club.currentBook, ratings: bookRatings });
    }
    const updated = { ...club, currentBook: { ...bookDraft, month, setBy: profile.name }, history };
    await saveClub(updated);
    setTab("feed");
  };

  const handlePost = async () => {
    if (!newUpdate.page && !newUpdate.comment) return;
    const upd = {
      id: rid(), userId: profile.id, userName: profile.name, userPhoto: profile.photo,
      page: parseInt(newUpdate.page) || 0, mood: newUpdate.mood, comment: newUpdate.comment,
      rating: newUpdate.rating || 0, timestamp: new Date().toISOString(),
    };
    let updatedClub = { ...club, updates: [upd, ...(club.updates || [])] };
    // Save rating if provided
    if (newUpdate.rating > 0 && currentBook) {
      const ratings = { ...(club.ratings || {}) };
      if (!ratings[currentBook.month]) ratings[currentBook.month] = {};
      ratings[currentBook.month][profile.id] = newUpdate.rating;
      updatedClub.ratings = ratings;
    }
    await saveClub(updatedClub);
    setNewUpdate({ page: "", mood: "", comment: "", rating: 0 });
    setShowPost(false);
  };

  const handleProfilePhoto = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setProfileDraft(p => ({ ...p, photo: ev.target.result }));
    r.readAsDataURL(f);
  };

  const handleBookCover = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setBookDraft(b => ({ ...b, coverUrl: ev.target.result }));
    r.readAsDataURL(f);
  };

  const handleSearchSelect = (result) => {
    setBookDraft({ title: result.title, author: result.author, coverUrl: result.cover, pages: result.pages?.toString() || "", genre: result.genre || "" });
    setShowSearch(false);
  };

  if (!loaded) return <p style={{ textAlign: "center", padding: 40, color: colors.textMuted, fontFamily: fonts.body }}>Carregando...</p>;

  // ─── Profile Setup ───
  if (!profile || editProfile) {
    return (
      <div style={{ padding: "0 20px 60px", maxWidth: 400, margin: "0 auto", animation: "bjFade .3s ease" }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: 6, fontStyle: "italic", textAlign: "center" }}>
          {profile ? "Editar Perfil" : "Bem-vinda ao Book Club! 📖"}
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: "center", marginBottom: 24 }}>
          {profile ? "Atualize suas informações" : "Crie seu perfil para participar"}
        </p>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div onClick={() => profileFileRef.current?.click()}
            style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto", cursor: "pointer",
              background: profileDraft.photo ? `url(${profileDraft.photo}) center/cover` : colors.clubSoft,
              border: `3px solid ${colors.club}`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 32, color: colors.clubDark, overflow: "hidden" }}>
            {!profileDraft.photo && "📷"}
          </div>
          <input ref={profileFileRef} type="file" accept="image/*" onChange={handleProfilePhoto} style={{ display: "none" }} />
          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 6 }}>Toque para adicionar foto</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>Seu nome</label>
          <input value={profileDraft.name} onChange={e => setProfileDraft(p => ({ ...p, name: e.target.value }))}
            placeholder="Como suas amigas te chamam?"
            style={{ fontFamily: fonts.body, fontSize: 16, color: colors.text, border: "none",
              borderBottom: `2px solid ${colors.club}`, background: "transparent", padding: "8px 0",
              width: "100%", outline: "none" }} />
        </div>
        <button onClick={() => {
          if (!profileDraft.name.trim()) return;
          const p = { ...profileDraft, id: profile?.id || rid(), joinedAt: profile?.joinedAt || new Date().toISOString() };
          saveProfile(p); setEditProfile(false);
        }}
          style={{ width: "100%", background: `linear-gradient(135deg,${colors.club},${colors.clubDark})`,
            color: "#fff", border: "none", borderRadius: 20, padding: "13px 0",
            fontFamily: fonts.body, fontSize: 15, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 4px 16px rgba(224,122,95,.3)` }}>
          {profile ? "Salvar" : "Entrar no Book Club"}
        </button>
        {profile && <button onClick={() => setEditProfile(false)}
          style={{ display: "block", margin: "12px auto", background: "none", border: "none",
            color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>Cancelar</button>}
      </div>
    );
  }

  const members = Object.values(club.members || {});
  const currentBook = club.currentBook;
  const updates = (club.updates || []).slice(0, 50);

  const getProgress = (userId) => {
    const userUpdates = updates.filter(u => u.userId === userId);
    if (!userUpdates.length) return 0;
    return Math.max(...userUpdates.map(u => u.page || 0));
  };

  const totalPages = parseInt(currentBook?.pages) || 1;

  // Build ranked members list
  const rankedMembers = members.map(m => {
    const mId = Object.keys(club.members || {}).find(k => club.members[k].name === m.name) || "";
    const progress = getProgress(mId);
    const pct = totalPages > 1 ? Math.round((progress / totalPages) * 100) : 0;
    const lastMood = updates.find(u => u.userName === m.name && u.mood)?.mood;
    return { ...m, id: mId, progress, pct: Math.min(pct, 100), lastMood };
  }).sort((a, b) => b.progress - a.progress);

  const podium = currentBook ? rankedMembers.slice(0, 3) : [];

  // Nominations (voting)
  const nominations = (club.nominations || [])
    .filter(n => !(n.alreadyRead || []).length)
    .sort((a, b) => (b.votes || []).length - (a.votes || []).length);

  const addNomination = async (nom) => {
    const n = { id: rid(), title: nom.title, author: nom.author, coverUrl: nom.coverUrl || "",
      genre: nom.genre || "", addedBy: profile.name, votes: [], alreadyRead: [] };
    await saveClub({ ...club, nominations: [...(club.nominations || []), n] });
    setNomDraft({ title: "", author: "", coverUrl: "", genre: "" });
    setShowAddNom(false);
  };

  const toggleVote = async (nomId) => {
    const noms = (club.nominations || []).map(n => {
      if (n.id !== nomId) return n;
      const votes = n.votes || [];
      const idx = votes.indexOf(profile.id);
      return { ...n, votes: idx >= 0 ? votes.filter(v => v !== profile.id) : [...votes, profile.id] };
    });
    await saveClub({ ...club, nominations: noms });
  };

  const markAlreadyRead = async (nomId) => {
    const noms = (club.nominations || []).map(n =>
      n.id === nomId ? { ...n, alreadyRead: [...(n.alreadyRead || []), profile.id] } : n
    );
    await saveClub({ ...club, nominations: noms });
  };

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>

      {/* Profile bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setEditProfile(true)}
            style={{ width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
              background: profile.photo ? `url(${profile.photo}) center/cover` : colors.clubSoft,
              border: `2px solid ${colors.club}`, flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 }}>
              Olá, {profile.name}!</p>
            <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, margin: 0 }}>
              {members.length} membro{members.length !== 1 ? "s" : ""} no clube</p>
          </div>
        </div>
        <button onClick={() => setEditProfile(true)}
          style={{ background: "none", border: `1px solid ${colors.border}`, borderRadius: 14,
            padding: "5px 10px", fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, cursor: "pointer" }}>✏️ Perfil</button>
      </div>

      {/* Current Book */}
      {currentBook ? (
        <div style={{ background: `linear-gradient(135deg, ${colors.clubSoft}, ${colors.card})`,
          borderRadius: 16, padding: 18, marginBottom: 20, border: `1px solid ${colors.clubLight}` }}>
          <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.club, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: .8, margin: "0 0 10px" }}>
            📖 Leitura de {new Date().toLocaleDateString("pt-BR", { month: "long" })}
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {currentBook.coverUrl ? (
              <img src={currentBook.coverUrl} alt="" style={{ width: 85, height: 122, objectFit: "cover",
                borderRadius: 8, boxShadow: `0 4px 14px rgba(0,0,0,.12)`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 85, height: 122, borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(145deg,${colors.club},${colors.clubDark})`,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 8, textAlign: "center" }}>
                <span style={{ fontFamily: fonts.display, fontSize: 12, fontWeight: 700, color: "#fff" }}>{currentBook.title}</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 700, color: colors.text,
                margin: "0 0 2px", lineHeight: 1.2 }}>{currentBook.title}</p>
              <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, margin: 0 }}>{currentBook.author}</p>
              {currentBook.genre && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                  {currentBook.genre.split(", ").filter(Boolean).map(g => (
                    <span key={g} style={{ fontSize: 9, fontFamily: fonts.body, fontWeight: 600,
                      background: "rgba(224,122,95,.12)", color: colors.clubDark, padding: "1px 6px", borderRadius: 6 }}>{g}</span>
                  ))}
                </div>
              )}
              {currentBook.pages && <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textLight, margin: "4px 0 0" }}>{currentBook.pages} páginas</p>}
              <button onClick={() => setTab("setbook")}
                style={{ marginTop: 6, background: "none", border: "none", color: colors.club,
                  fontFamily: fonts.body, fontSize: 11, cursor: "pointer", fontWeight: 600, padding: 0 }}>Trocar livro →</button>
            </div>
            {/* Mini ranking */}
            {podium.length > 0 && podium.some(p => p.progress > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, alignItems: "center" }}>
                {podium.filter(p => p.progress > 0).map((m, i) => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%",
                        background: m.photo ? `url(${m.photo}) center/cover` : colors.clubSoft,
                        border: `2px solid ${i === 0 ? colors.club : colors.clubLight}` }} />
                      <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 10 }}>
                        {["🥇","🥈","🥉"][i]}
                      </span>
                    </div>
                    <span style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700,
                      color: i === 0 ? colors.club : colors.textMuted }}>{m.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 30, background: colors.clubSoft, borderRadius: 16,
          marginBottom: 20, border: `2px dashed ${colors.clubLight}` }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📚</p>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.clubDark, fontWeight: 600 }}>Nenhum livro definido</p>
          <button onClick={() => setTab("setbook")}
            style={{ marginTop: 10, background: colors.club, color: "#fff", border: "none",
              borderRadius: 16, padding: "8px 20px", fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Escolher livro do mês
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${colors.border}`, marginBottom: 16 }}>
        {[{k:"feed",l:"Atividade",i:"💬"},{k:"voting",l:"Votação",i:"🗳️"},{k:"members",l:"Membros",i:"👥"},{k:"analytics",l:"Análises",i:"📊"}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ background: "none", border: "none",
              borderBottom: tab===t.k ? `2px solid ${colors.club}` : "2px solid transparent",
              padding: "8px 12px", fontFamily: fonts.body, fontSize: 12,
              fontWeight: tab===t.k ? 600 : 400, color: tab===t.k ? colors.clubDark : colors.textMuted,
              cursor: "pointer", marginBottom: -1 }}>{t.i} {t.l}</button>
        ))}
      </div>

      {/* ─── FEED TAB ─── */}
      {tab === "feed" && (
        <div>
          {/* Post update button */}
          {currentBook && !showPost && (
            <button onClick={() => setShowPost(true)}
              style={{ width: "100%", background: colors.card, border: `1.5px solid ${colors.border}`,
                borderRadius: 14, padding: 14, marginBottom: 16, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = colors.club}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
              <div style={{ width: 32, height: 32, borderRadius: "50%",
                background: profile.photo ? `url(${profile.photo}) center/cover` : colors.clubSoft,
                border: `2px solid ${colors.clubLight}`, flexShrink: 0 }} />
              <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textLight }}>Como está a leitura?</span>
            </button>
          )}

          {/* Post form */}
          {showPost && currentBook && (
            <div style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 16,
              border: `1.5px solid ${colors.club}` }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase" }}>Página atual</label>
                  <input type="number" value={newUpdate.page} onChange={e => setNewUpdate(u => ({ ...u, page: e.target.value }))}
                    placeholder={`de ${currentBook.pages || "?"}`} min="0" max={currentBook.pages || 9999}
                    style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 600, color: colors.text,
                      border: "none", borderBottom: `1.5px solid ${colors.border}`, padding: "4px 0",
                      width: "100%", outline: "none", background: "transparent" }} />
                </div>
                {currentBook.pages && newUpdate.page && (
                  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
                    <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
                      color: colors.club }}>{Math.round((parseInt(newUpdate.page) / parseInt(currentBook.pages)) * 100)}%</span>
                  </div>
                )}
              </div>

              <label style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Como está se sentindo?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {MOODS.map(m => (
                  <button key={m.emoji} onClick={() => setNewUpdate(u => ({ ...u, mood: u.mood === m.emoji ? "" : m.emoji }))}
                    style={{ background: newUpdate.mood === m.emoji ? colors.clubSoft : "transparent",
                      border: `1.5px solid ${newUpdate.mood === m.emoji ? colors.club : colors.border}`,
                      borderRadius: 20, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                      fontFamily: fonts.body, color: newUpdate.mood === m.emoji ? colors.clubDark : colors.textMuted,
                      fontWeight: newUpdate.mood === m.emoji ? 600 : 400, transition: "all .2s" }}>
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              {/* Rating when finished */}
              {(() => {
                const isFinished = currentBook?.pages && parseInt(newUpdate.page) >= parseInt(currentBook.pages);
                if (isFinished) return (
                  <div style={{ background: colors.greenLight, borderRadius: 10, padding: 12, marginBottom: 4,
                    border: `1px solid ${colors.green}` }}>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.greenDark, margin: "0 0 8px" }}>
                      🎉 Parabéns! Você terminou o livro! Avalie:
                    </p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Stars rating={newUpdate.rating} onRate={r => setNewUpdate(u => ({ ...u, rating: r }))} size={28} />
                    </div>
                  </div>
                );
                return null;
              })()}

              <textarea value={newUpdate.comment} onChange={e => setNewUpdate(u => ({ ...u, comment: e.target.value }))}
                placeholder={currentBook?.pages && parseInt(newUpdate.page) >= parseInt(currentBook.pages) ? "O que achou do livro? 🎉" : "Compartilhe seus pensamentos, sem spoilers! ✨"}
                style={{ fontFamily: fonts.hand, fontSize: 16, color: colors.text,
                  border: `1px solid ${colors.border}`, borderRadius: 10, padding: 10,
                  width: "100%", minHeight: 60, resize: "vertical", outline: "none",
                  background: colors.bg }} />

              <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setShowPost(false)}
                  style={{ background: "none", border: `1px solid ${colors.border}`, borderRadius: 14,
                    padding: "7px 16px", fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handlePost}
                  style={{ background: `linear-gradient(135deg,${colors.club},${colors.clubDark})`,
                    color: "#fff", border: "none", borderRadius: 14, padding: "7px 20px",
                    fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Publicar</button>
              </div>
            </div>
          )}

          {/* Updates feed */}
          {updates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 20px", color: colors.textMuted, fontFamily: fonts.body }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
              <p style={{ fontSize: 13 }}>Nenhuma atualização ainda</p>
              <p style={{ fontSize: 11, color: colors.textLight }}>Seja a primeira a compartilhar!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {updates.map(u => {
                const pct = currentBook?.pages ? Math.round((u.page / parseInt(currentBook.pages)) * 100) : 0;
                const date = new Date(u.timestamp);
                const timeStr = date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) +
                  " · " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={u.id} style={{ background: colors.card, borderRadius: 14, padding: 14,
                    border: `1px solid ${colors.border}` }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        background: u.userPhoto ? `url(${u.userPhoto}) center/cover` : colors.clubSoft,
                        border: `2px solid ${colors.clubLight}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text }}>{u.userName}</span>
                          <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textLight }}>{timeStr}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                          {u.page > 0 && (
                            <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.club, fontWeight: 700 }}>
                              📄 Pág. {u.page}{currentBook?.pages ? ` (${pct}%)` : ""}
                            </span>
                          )}
                          {u.mood && <span style={{ fontSize: 16 }}>{u.mood}</span>}
                          {u.rating > 0 && <Stars rating={u.rating} size={11} interactive={false} />}
                        </div>
                        {u.page > 0 && currentBook?.pages && (
                          <div style={{ height: 4, borderRadius: 2, background: colors.clubSoft, marginTop: 6, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`,
                              background: pct >= 100 ? colors.green : colors.club, borderRadius: 2 }} />
                          </div>
                        )}
                        {u.comment && (
                          <p style={{ fontFamily: fonts.hand, fontSize: 15, color: colors.text,
                            margin: "8px 0 0", lineHeight: 1.4 }}>{u.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── VOTING TAB ─── */}
      {tab === "voting" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontFamily: fonts.display, fontSize: 18, color: colors.text, margin: 0, fontStyle: "italic" }}>
                🗳️ Próxima leitura
              </h3>
              <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>
                Vote no próximo livro do clube!
              </p>
            </div>
            <button onClick={() => setShowAddNom(true)}
              style={{ background: `linear-gradient(135deg,${colors.club},${colors.clubDark})`,
                border: "none", borderRadius: 16, padding: "7px 14px", fontFamily: fonts.body,
                fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>+ Indicar livro</button>
          </div>

          {/* Add nomination form */}
          {showAddNom && (
            <div style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 16,
              border: `1.5px solid ${colors.club}` }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => setShowNomSearch(true)}
                  style={{ background: colors.clubSoft, border: `1.5px solid ${colors.club}`, borderRadius: 14,
                    padding: "6px 12px", fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                    color: colors.clubDark, cursor: "pointer" }}>🔍 Buscar</button>
                <button onClick={() => setShowWishPick(true)}
                  style={{ background: colors.wishSoft, border: `1.5px solid ${colors.wish}`, borderRadius: 14,
                    padding: "6px 12px", fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                    color: colors.wishDark, cursor: "pointer" }}>📋 Da Wishlist</button>
                <button onClick={() => { const inp = document.createElement("input"); inp.type="file"; inp.accept="image/*";
                  inp.onchange = (ev) => { const f = ev.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onload = e => setNomDraft(d => ({ ...d, coverUrl: e.target.result })); r.readAsDataURL(f); };
                  inp.click(); }}
                  style={{ background: colors.clubSoft, border: `1.5px solid ${colors.club}`, borderRadius: 14,
                    padding: "6px 12px", fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                    color: colors.clubDark, cursor: "pointer" }}>📷 Capa</button>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                {nomDraft.coverUrl && (
                  <img src={nomDraft.coverUrl} alt="" style={{ width: 50, height: 72, objectFit: "cover",
                    borderRadius: 6, flexShrink: 0, boxShadow: `0 2px 6px ${colors.shadow}` }} />
                )}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input value={nomDraft.title} onChange={e => setNomDraft(d => ({ ...d, title: e.target.value }))}
                    placeholder="Título" style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.text,
                      border: "none", borderBottom: `1px solid ${colors.border}`, padding: "3px 0", outline: "none", background: "transparent" }} />
                  <input value={nomDraft.author} onChange={e => setNomDraft(d => ({ ...d, author: e.target.value }))}
                    placeholder="Autor" style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted,
                      border: "none", borderBottom: `1px solid ${colors.border}`, padding: "3px 0", outline: "none", background: "transparent" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowAddNom(false); setNomDraft({ title: "", author: "", coverUrl: "", genre: "" }); }}
                  style={{ background: "none", border: `1px solid ${colors.border}`, borderRadius: 12,
                    padding: "6px 14px", fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, cursor: "pointer" }}>Cancelar</button>
                <button onClick={() => { if (nomDraft.title) addNomination(nomDraft); }}
                  style={{ background: colors.club, color: "#fff", border: "none", borderRadius: 12,
                    padding: "6px 14px", fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    opacity: nomDraft.title ? 1 : .5 }}>Indicar</button>
              </div>
            </div>
          )}

          {/* Wishlist picker modal */}
          {showWishPick && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200,
              display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "bjFade .2s ease" }}
              onClick={e => e.target === e.currentTarget && setShowWishPick(false)}>
              <div style={{ background: colors.bg, borderRadius: "20px 20px 0 0", width: "100%",
                maxWidth: 500, maxHeight: "70vh", overflow: "hidden", display: "flex",
                flexDirection: "column", animation: "bjSlide .3s ease" }}>
                <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${colors.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontFamily: fonts.display, fontSize: 16, fontStyle: "italic", color: colors.text, margin: 0 }}>Escolher da Wishlist</h3>
                  <button onClick={() => setShowWishPick(false)} style={{ background: "none", border: "none", fontSize: 20, color: colors.textMuted, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                  {myWishes.length === 0 ? (
                    <p style={{ textAlign: "center", color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, padding: 20 }}>Sua wishlist está vazia</p>
                  ) : (
                    myWishes.map(w => (
                      <div key={w.id} onClick={() => {
                        setNomDraft({ title: w.title, author: w.author || "", coverUrl: w.coverUrl || "", genre: w.genre || "" });
                        setShowWishPick(false);
                      }}
                        style={{ display: "flex", gap: 10, padding: 10, borderRadius: 10, cursor: "pointer",
                          border: `1px solid ${colors.border}`, marginBottom: 6, background: colors.card, transition: "all .2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = colors.wish}
                        onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
                        {w.coverUrl && <img src={w.coverUrl} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 4 }} />}
                        <div>
                          <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text, margin: 0 }}>{w.title}</p>
                          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, margin: 0 }}>{w.author}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nomination list */}
          {nominations.length === 0 && !showAddNom ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textMuted, fontFamily: fonts.body }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🗳️</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma indicação ainda</p>
              <p style={{ fontSize: 12, color: colors.textLight }}>Indique livros para o próximo mês!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nominations.map((n, i) => {
                const voteCount = (n.votes || []).length;
                const hasVoted = (n.votes || []).includes(profile.id);
                return (
                  <div key={n.id} style={{ background: colors.card, borderRadius: 14, padding: 14,
                    border: `1.5px solid ${hasVoted ? colors.club : colors.border}`,
                    transition: "all .2s" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {/* Rank */}
                      <div style={{ textAlign: "center", flexShrink: 0, minWidth: 28 }}>
                        <span style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 700,
                          color: i === 0 && voteCount > 0 ? colors.club : colors.textLight }}>
                          {i === 0 && voteCount > 0 ? "🔥" : `#${i + 1}`}
                        </span>
                      </div>

                      {/* Cover */}
                      {n.coverUrl && (
                        <img src={n.coverUrl} alt="" style={{ width: 45, height: 65, objectFit: "cover",
                          borderRadius: 6, flexShrink: 0, boxShadow: `0 2px 6px ${colors.shadow}` }} />
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.text,
                          margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                        {n.author && <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>{n.author}</p>}
                        {n.genre && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                            {n.genre.split(", ").filter(Boolean).slice(0, 3).map(g => (
                              <span key={g} style={{ fontSize: 9, fontFamily: fonts.body, fontWeight: 600,
                                background: colors.clubSoft, color: colors.clubDark, padding: "1px 6px", borderRadius: 6 }}>{g}</span>
                            ))}
                          </div>
                        )}
                        <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textLight, margin: "4px 0 0" }}>
                          Indicado por {n.addedBy}
                        </p>
                      </div>

                      {/* Vote button */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => toggleVote(n.id)}
                          style={{ background: hasVoted ? colors.club : "transparent",
                            border: `2px solid ${hasVoted ? colors.club : colors.border}`,
                            borderRadius: 12, width: 44, height: 44, cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", gap: 1, transition: "all .2s" }}>
                          <span style={{ fontSize: 16 }}>{hasVoted ? "🤍" : "🤍"}</span>
                          <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                            color: hasVoted ? "#fff" : colors.textMuted }}>{voteCount}</span>
                        </button>
                        <button onClick={() => markAlreadyRead(n.id)}
                          style={{ background: "none", border: "none", fontFamily: fonts.body,
                            fontSize: 9, color: colors.textLight, cursor: "pointer", padding: 0 }}>
                          Já li
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showNomSearch && <CoverSearch onSelect={r => {
            setNomDraft({ title: r.title, author: r.author, coverUrl: r.cover, genre: r.genre || "" });
            setShowNomSearch(false);
          }} onClose={() => setShowNomSearch(false)} />}
        </div>
      )}

      {/* ─── MEMBERS TAB ─── */}
      {tab === "members" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rankedMembers.map((m, idx) => (
              <div key={m.name} style={{ background: colors.card, borderRadius: 14, padding: 14,
                border: `1px solid ${colors.border}`, display: "flex", gap: 12, alignItems: "center" }}>
                {/* Position */}
                <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
                  {idx < 3 && m.progress > 0
                    ? <span style={{ fontSize: 18 }}>{["🥇","🥈","🥉"][idx]}</span>
                    : <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.textLight }}>{idx + 1}</span>
                  }
                </div>
                <div style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                  background: m.photo ? `url(${m.photo}) center/cover` : colors.clubSoft,
                  border: `2.5px solid ${idx === 0 && m.progress > 0 ? colors.club : colors.clubLight}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.text }}>{m.name}</span>
                    {m.lastMood && <span style={{ fontSize: 14 }}>{m.lastMood}</span>}
                  </div>
                  {currentBook && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted }}>Pág. {m.progress} de {totalPages}</span>
                        <span style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, color: m.pct >= 100 ? colors.green : colors.club }}>{m.pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: colors.clubSoft, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${m.pct}%`,
                          background: m.pct >= 100 ? `linear-gradient(90deg,${colors.green},${colors.greenDark})` : `linear-gradient(90deg,${colors.club},${colors.clubDark})`,
                          borderRadius: 3, transition: "width .5s" }} />
                      </div>
                    </div>
                  )}
                  <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textLight, margin: "4px 0 0" }}>
                    Membro desde {new Date(m.joinedAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: colors.textMuted, fontFamily: fonts.body }}>
              <p style={{ fontSize: 13 }}>Compartilhe o link deste artefato com suas amigas!</p>
              <p style={{ fontSize: 11, color: colors.textLight }}>Cada uma cria seu perfil ao acessar 🎉</p>
            </div>
          )}
        </div>
      )}

      {/* ─── SET BOOK TAB ─── */}
      {tab === "setbook" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setTab("feed")} style={{ background: "none", border: "none", fontSize: 14,
              color: colors.club, cursor: "pointer", fontFamily: fonts.body, fontWeight: 600 }}>← Voltar</button>
          </div>
          <h3 style={{ fontFamily: fonts.display, fontSize: 18, color: colors.text, marginBottom: 16, fontStyle: "italic" }}>
            📖 Definir livro do mês
          </h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowSearch(true)}
              style={{ background: colors.clubSoft, border: `1.5px solid ${colors.club}`, borderRadius: 16,
                padding: "8px 16px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.clubDark, cursor: "pointer" }}>
              🔍 Buscar livro
            </button>
            <button onClick={() => fileRef.current?.click()}
              style={{ background: colors.clubSoft, border: `1.5px solid ${colors.club}`, borderRadius: 16,
                padding: "8px 16px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.clubDark, cursor: "pointer" }}>
              📷 Upload capa
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleBookCover} style={{ display: "none" }} />
          </div>
          {bookDraft.coverUrl && (
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              <img src={bookDraft.coverUrl} alt="" style={{ width: 80, height: 115, objectFit: "cover", borderRadius: 8,
                boxShadow: `0 3px 12px rgba(0,0,0,.12)` }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700, color: colors.text, margin: 0 }}>{bookDraft.title}</p>
                <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, margin: "2px 0" }}>{bookDraft.author}</p>
                {bookDraft.pages && <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textLight }}>{bookDraft.pages} páginas</p>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={bookDraft.title} onChange={e => setBookDraft(b => ({ ...b, title: e.target.value }))}
              placeholder="Título do livro" style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text,
                border: "none", borderBottom: `1px solid ${colors.border}`, padding: "6px 0", outline: "none", background: "transparent" }} />
            <input value={bookDraft.author} onChange={e => setBookDraft(b => ({ ...b, author: e.target.value }))}
              placeholder="Autor(a)" style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text,
                border: "none", borderBottom: `1px solid ${colors.border}`, padding: "6px 0", outline: "none", background: "transparent" }} />
            <input type="number" value={bookDraft.pages} onChange={e => setBookDraft(b => ({ ...b, pages: e.target.value }))}
              placeholder="Nº de páginas" style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text,
                border: "none", borderBottom: `1px solid ${colors.border}`, padding: "6px 0", outline: "none", background: "transparent" }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Gênero</label>
            <GenrePicker value={bookDraft.genre} onChange={v => setBookDraft(b => ({ ...b, genre: v }))} compact={true} />
          </div>
          <button onClick={handleSetBook}
            style={{ marginTop: 20, width: "100%", background: `linear-gradient(135deg,${colors.club},${colors.clubDark})`,
              color: "#fff", border: "none", borderRadius: 18, padding: "12px 0",
              fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            ✓ Definir como livro do mês
          </button>
        </div>
      )}

      {/* ─── ANALYTICS TAB ─── */}
      {tab === "analytics" && (() => {
        const hist = club.history || [];
        const allRatings = club.ratings || {};
        const totalBooks = hist.length + (currentBook ? 1 : 0);
        const genreMap = {};
        hist.forEach(b => { if (b.genre) b.genre.split(", ").filter(Boolean).forEach(g => { genreMap[g] = (genreMap[g]||0)+1; }); });
        if (currentBook?.genre) currentBook.genre.split(", ").filter(Boolean).forEach(g => { genreMap[g] = (genreMap[g]||0)+1; });
        const topGenres = Object.entries(genreMap).sort((a,b) => b[1]-a[1]);
        const allGenreNames = [...new Set([...Object.keys(GENRES).flatMap(k => GENRES[k])])];
        const unreadGenres = allGenreNames.filter(g => !genreMap[g]);

        const booksWithRatings = hist.filter(b => b.ratings && Object.keys(b.ratings).length > 0).map(b => {
          const rats = Object.values(b.ratings);
          const avg = rats.reduce((s,r) => s+r, 0) / rats.length;
          return { ...b, avgRating: avg, ratingCount: rats.length };
        }).sort((a,b) => b.avgRating - a.avgRating);

        const suggestedGenre = unreadGenres.length > 0
          ? unreadGenres[Math.floor(Math.random() * Math.min(3, unreadGenres.length))]
          : topGenres.length > 0 ? topGenres[0][0] : null;

        // Completion stats
        const completionRates = members.map(m => {
          const finished = hist.filter(b => {
            const bookUpdates = updates.filter(u => u.userName === m.name && parseInt(b.pages) > 0 && u.page >= parseInt(b.pages));
            return bookUpdates.length > 0;
          }).length;
          return { name: m.name, photo: m.photo, finished, total: hist.length };
        }).sort((a,b) => b.finished - a.finished);

        return (
          <div>
            {/* Overview cards */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { icon: "📚", label: "Livros lidos", value: totalBooks, color: colors.club },
                { icon: "🎭", label: "Gêneros", value: Object.keys(genreMap).length, color: colors.accent },
                { icon: "👥", label: "Membros", value: members.length, color: colors.wish },
              ].map(c => (
                <div key={c.label} style={{ flex: 1, minWidth: 80, background: colors.card, borderRadius: 14, padding: 14,
                  border: `1px solid ${colors.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
                  <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: .5 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Best rated books */}
            {booksWithRatings.length > 0 && (
              <div style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${colors.border}` }}>
                <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.text, marginBottom: 12, fontStyle: "italic" }}>⭐ Livros mais amados</h3>
                {booksWithRatings.slice(0, 5).map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
                    borderBottom: i < booksWithRatings.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                    {b.coverUrl && <img src={b.coverUrl} alt="" style={{ width: 30, height: 43, objectFit: "cover", borderRadius: 4 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.text, margin: 0 }}>{b.title}</p>
                      <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, margin: 0 }}>{b.author}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Stars rating={Math.round(b.avgRating)} size={10} interactive={false} />
                      <p style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, margin: 0 }}>{b.avgRating.toFixed(1)} ({b.ratingCount})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Genre breakdown */}
            {topGenres.length > 0 && (
              <div style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${colors.border}` }}>
                <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.text, marginBottom: 12, fontStyle: "italic" }}>🎭 Gêneros explorados</h3>
                {topGenres.map(([g, c], i) => (
                  <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text, marginBottom: 3 }}>{g}</div>
                      <div style={{ height: 5, borderRadius: 3, background: colors.clubSoft, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(c / topGenres[0][1]) * 100}%`,
                          background: `linear-gradient(90deg,${colors.club},${colors.clubDark})`, borderRadius: 3 }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, fontWeight: 600 }}>{c}x</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestion */}
            <div style={{ background: `linear-gradient(135deg, ${colors.clubSoft}, ${colors.card})`,
              borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${colors.clubLight}` }}>
              <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.clubDark, marginBottom: 8, fontStyle: "italic" }}>💡 Sugestão para o próximo mês</h3>
              {suggestedGenre ? (
                <div>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, margin: "0 0 6px" }}>
                    {unreadGenres.includes(suggestedGenre)
                      ? `Vocês ainda não exploraram o gênero "${suggestedGenre}". Que tal experimentar algo novo?`
                      : `O gênero favorito do grupo é "${suggestedGenre}". Mais um desse?`}
                  </p>
                  <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted }}>
                    {topGenres.length >= 3
                      ? `📊 Top 3 do clube: ${topGenres.slice(0, 3).map(([g]) => g).join(", ")}`
                      : "Continue explorando novos gêneros juntas!"}
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>Definam mais livros para receber sugestões!</p>
              )}
            </div>

            {/* Completion leaderboard */}
            {completionRates.length > 0 && hist.length > 0 && (
              <div style={{ background: colors.card, borderRadius: 14, padding: 16, border: `1px solid ${colors.border}` }}>
                <h3 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.text, marginBottom: 12, fontStyle: "italic" }}>🏅 Quem mais completou</h3>
                {completionRates.map((m, i) => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
                    borderBottom: i < completionRates.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%",
                      background: m.photo ? `url(${m.photo}) center/cover` : colors.clubSoft,
                      border: `2px solid ${colors.clubLight}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.text }}>{m.name}</span>
                    </div>
                    <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: colors.club }}>
                      {m.finished}/{m.total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hist.length === 0 && (
              <div style={{ textAlign: "center", padding: 30, color: colors.textMuted, fontFamily: fonts.body }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
                <p style={{ fontSize: 13 }}>As análises aparecerão quando vocês trocarem de livro</p>
                <p style={{ fontSize: 11, color: colors.textLight }}>O histórico é criado ao definir um novo livro do mês</p>
              </div>
            )}
          </div>
        );
      })()}

      {showSearch && <CoverSearch onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [data, setData] = useState({ books: [], wishes: [], years: [2022,2023,2024,2025,2026] });
  const [view, setView] = useState("library");
  const [year, setYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [activeSeries, setActiveSeries] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const importRef = useRef(null);

  useEffect(() => { (async () => {
    try { const r = await window.storage.get(STORAGE_KEY); if (r?.value) setData(JSON.parse(r.value)); } catch(e) {}
    setLoaded(true);
  })(); }, []);

  const save = useCallback(async d => { setData(d); try { await window.storage.set(STORAGE_KEY, JSON.stringify(d)); } catch(e) {} }, []);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bookjournal-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importBackup = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.books || imported.wishes || imported.years) {
          save(imported);
          alert("Backup restaurado com sucesso!");
        } else { alert("Arquivo inválido"); }
      } catch(err) { alert("Erro ao ler arquivo"); }
    };
    reader.readAsText(file);
  };

  const yearBooks = (data.books||[]).filter(b => b.year===year && b.status!=="wishlist");
  const searchedBooks = searchQ ? yearBooks.filter(b => b.title.toLowerCase().includes(searchQ.toLowerCase())||b.author.toLowerCase().includes(searchQ.toLowerCase())) : yearBooks;

  const addBook = (seriesName = "") => {
    const nb = emptyBook(year, seriesName);
    if (seriesName) {
      const existing = data.books.filter(b => b.seriesName === seriesName);
      nb.seriesNumber = existing.length + 1;
      const maxTotal = Math.max(...existing.map(b => b.seriesTotal || 0), 0);
      if (maxTotal) nb.seriesTotal = maxTotal;
    }
    save({ ...data, books: [nb, ...data.books] });
    setSelected(nb); setView("review");
  };

  const updateBook = ub => {
    let ws = data.wishes || [];
    const old = data.books.find(b => b.id === ub.id);
    if (ub.status === "wishlist" && old && old.status !== "wishlist") {
      if (!ws.some(w => w.title === ub.title && w.author === ub.author)) {
        const w = emptyWish(); w.title=ub.title; w.author=ub.author; w.genre=ub.genre; w.coverUrl=ub.coverUrl; w.coverColor=ub.coverColor;
        ws = [...ws, w];
      }
    }
    save({ ...data, books: data.books.map(b => b.id===ub.id ? ub : b), wishes: ws });
  };
  const deleteBook = id => save({ ...data, books: data.books.filter(b => b.id!==id) });
  const addYear = () => { const m = Math.max(...data.years); save({ ...data, years: [...data.years, m+1] }); setYear(m+1); };
  const addWish = () => save({ ...data, wishes: [...(data.wishes||[]), emptyWish()] });
  const updateWishes = w => save({ ...data, wishes: w });
  const deleteWish = id => save({ ...data, wishes: (data.wishes||[]).filter(w => w.id!==id) });

  const startReading = (wish) => {
    const nb = emptyBook(year);
    nb.title = wish.title; nb.author = wish.author || ""; nb.genre = wish.genre || "";
    nb.coverUrl = wish.coverUrl || ""; nb.coverColor = wish.coverColor || rcolor();
    nb.status = "reading";
    const newBooks = [nb, ...data.books];
    const newWishes = (data.wishes || []).filter(w => w.id !== wish.id);
    save({ ...data, books: newBooks, wishes: newWishes });
    setSelected(nb); setView("review");
  };

  if (!loaded) return (<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: colors.bg, fontFamily: fonts.display, fontSize: 20, color: colors.accent, fontStyle: "italic" }}>Carregando...</div>);

  const isMain = view==="library"||view==="wishlist"||view==="stats"||view==="bookclub";
  const seriesBooks = activeSeries ? (data.books||[]).filter(b => b.seriesName===activeSeries && b.year===year) : [];

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: fonts.body, WebkitFontSmoothing: "antialiased" }}>

      {/* HEADER */}
      <div style={{ padding: "16px 20px 0", position: "sticky", top: 0, background: `${colors.bg}f0`,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: -.5 }}>
            <span style={{ color: colors.accent }}>Book</span> Journal</h1>
          <div style={{ display: "flex", gap: 6 }}>
            {view==="library" && (
              <button onClick={() => { setShowSearchBar(!showSearchBar); setSearchQ(""); }}
                style={{ background: showSearchBar ? colors.accentSoft : "transparent",
                  border: `1px solid ${showSearchBar ? colors.accent : colors.border}`,
                  borderRadius: 20, width: 34, height: 34, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", fontSize: 15 }}>🔍</button>)}
            <button onClick={() => setShowBackup(!showBackup)}
              style={{ background: showBackup ? colors.accentSoft : "transparent",
                border: `1px solid ${showBackup ? colors.accent : colors.border}`,
                borderRadius: 20, width: 34, height: 34, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 14 }}>⚙️</button>
          </div>
        </div>
        {isMain && (
          <div style={{ display: "flex", gap: 0, marginTop: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
            {(data.years||[]).map(y => (
              <button key={y} onClick={() => { setYear(y); if (view!=="wishlist"&&view!=="bookclub") setView("library"); setFilter("all"); }}
                style={{ background: "none", border: "none",
                  borderBottom: year===y && view!=="wishlist" && view!=="bookclub" ? `2.5px solid ${colors.accent}` : "2.5px solid transparent",
                  padding: "8px 14px", fontFamily: fonts.body, fontSize: 14,
                  fontWeight: year===y && view!=="wishlist" && view!=="bookclub" ? 700 : 400,
                  color: year===y && view!=="wishlist" && view!=="bookclub" ? colors.accent : colors.textMuted,
                  cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}>{y}</button>))}
            <button onClick={addYear} style={{ background: "none", border: "none", padding: "8px 10px",
              fontSize: 16, color: colors.textLight, cursor: "pointer", borderBottom: "2.5px solid transparent" }}>+</button>
          </div>
        )}
        {isMain && (
          <>
            {showSearchBar && view==="library" && (
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus placeholder="Buscar por título ou autor..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${colors.border}`,
                  background: colors.card, fontFamily: fonts.body, fontSize: 14, color: colors.text, outline: "none", marginTop: 8 }}
                onFocus={e => e.target.style.borderColor=colors.accent} onBlur={e => e.target.style.borderColor=colors.border} />)}
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${colors.border}`, marginTop: 4 }}>
              {[{k:"library",l:"Biblioteca",i:"📚",c:colors.accent},{k:"wishlist",l:"Wishlist",i:"📋",c:colors.wish},{k:"bookclub",l:"Book Club",i:"📖",c:colors.club},{k:"stats",l:"Estatísticas",i:"📊",c:colors.accent}].map(t => (
                <button key={t.k} onClick={() => setView(t.k)}
                  style={{ background: "none", border: "none",
                    borderBottom: view===t.k ? `2px solid ${t.c}` : "2px solid transparent",
                    padding: "9px 14px", fontFamily: fonts.body, fontSize: 13,
                    fontWeight: view===t.k ? 600 : 400,
                    color: view===t.k ? (t.k==="wishlist"?colors.wishDark:t.k==="bookclub"?colors.clubDark:colors.accent) : colors.textMuted,
                    cursor: "pointer", marginBottom: -1, transition: "all .2s" }}>{t.i} {t.l}</button>))}
            </div>
          </>
        )}
      </div>

      {/* BACKUP PANEL */}
      {showBackup && (
        <div style={{ padding: "12px 20px 16px", animation: "bjFade .2s ease" }}>
          <div style={{ background: colors.card, borderRadius: 14, padding: 16, border: `1px solid ${colors.border}` }}>
            <h3 style={{ fontFamily: fonts.display, fontSize: 16, color: colors.text, margin: "0 0 12px", fontStyle: "italic" }}>⚙️ Backup dos dados</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, margin: "0 0 14px" }}>
              Exporte seus dados para não perder nada. Importe para restaurar.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportBackup}
                style={{ flex: 1, background: `linear-gradient(135deg,${colors.accent},${colors.accentDark})`,
                  color: "#fff", border: "none", borderRadius: 14, padding: "10px 0",
                  fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                📥 Exportar backup
              </button>
              <button onClick={() => importRef.current?.click()}
                style={{ flex: 1, background: colors.card, color: colors.accent,
                  border: `1.5px solid ${colors.accent}`, borderRadius: 14, padding: "10px 0",
                  fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                📤 Importar backup
              </button>
              <input ref={importRef} type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
            </div>
            <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textLight, margin: "10px 0 0", textAlign: "center" }}>
              📚 {data.books.length} livros • 📋 {(data.wishes||[]).length} na wishlist
            </p>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{ paddingTop: 18 }}>
        {view==="library" && <LibraryView books={searchedBooks} onSelect={b => { setSelected(b); setView("review"); }}
          onSelectSeries={name => { setActiveSeries(name); setView("series"); }} filter={filter} setFilter={setFilter} />}
        {view==="series" && activeSeries && <SeriesView seriesName={activeSeries} books={seriesBooks}
          onSelectBook={b => { setSelected(b); setView("review"); }}
          onAddBook={() => addBook(activeSeries)}
          onBack={() => { setActiveSeries(null); setView("library"); }} />}
        {view==="review" && selected && <ReviewPage book={selected} allBooks={data.books}
          onUpdate={updateBook} onDelete={deleteBook}
          backLabel={activeSeries ? `← ${activeSeries}` : "← Biblioteca"}
          onBack={() => { setSelected(null); setView(activeSeries ? "series" : "library"); }} />}
        {view==="stats" && <StatsView books={yearBooks} />}
        {view==="wishlist" && <WishlistView wishes={data.wishes||[]} onUpdate={updateWishes} onAdd={addWish} onDelete={deleteWish} onStartReading={startReading} />}
        {view==="bookclub" && <BookClubView />}
      </div>

      {(view==="library"||view==="stats") && <FAB onClick={() => addBook()}>+</FAB>}
    </div>
  );
}
