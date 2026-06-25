import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Tính năng đang đi nghỉ mát ở Phú Quốc 🏖️",
  "Developer đang ngủ, vui lòng thử lại vào năm sau 😴",
  "Tính năng bị mèo ăn mất rồi 🐱",
  "Đang thuê thêm dev, ETA: khi nào xong thì xong ⏳",
  "404 — tính năng rớt xuống biển, chưa tìm được 🌊",
  "Chức năng này đang được AI viết... AI cũng chưa hiểu yêu cầu 🤖",
];

const EMOJIS = ["🚧", "🛸", "🐛", "👻", "🦄", "🔮", "🎪", "🎭"];

function randomItem<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FeaturesPage() {
  const [msg, setMsg] = useState(MESSAGES[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setMsg(randomItem(MESSAGES));
    setEmoji(randomItem(EMOJIS));
  }, []);

  const handleClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 600);
    setMsg(randomItem(MESSAGES));
    setEmoji(randomItem(EMOJIS));
  };

  return (
    <>
      <Head>
        <title>Tính năng · CloudVault</title>
      </Head>

      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
        {/* bg glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />

        {/* bouncy emoji */}
        <button
          onClick={handleClick}
          aria-label="Bấm để đổi thông điệp"
          className={`mb-6 select-none text-8xl transition-transform duration-150 focus:outline-none ${
            bounce ? "scale-125" : "scale-100"
          } hover:scale-110 cursor-pointer`}
          style={{ filter: "drop-shadow(0 0 24px var(--primary-glow))" }}
        >
          {emoji}
        </button>

        {/* 404 */}
        <h1
          className="mb-2 text-[120px] font-black leading-none tracking-tighter"
          style={{
            background: "var(--gradient-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        <h2 className="mb-3 text-2xl font-bold">Trang này chưa tồn tại!</h2>

        {/* rotating funny message */}
        <p className="mb-8 max-w-md text-base text-[var(--muted-foreground)]">{msg}</p>

        {/* hint */}
        <p className="mb-10 text-xs text-[var(--muted-foreground)] opacity-60">
          (Bấm vào emoji bên trên để nghe thêm lý do 👆)
        </p>

        {/* back home button */}
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          🏠 Về trang chủ
        </Link>

        {/* floating stars decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute text-lg opacity-20"
              style={{
                top: `${10 + (i * 73) % 80}%`,
                left: `${5 + (i * 47) % 90}%`,
                animation: `float ${3 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
              }}
            >
              {["✦", "✧", "⋆", "·"][i % 4]}
            </span>
          ))}
        </div>
      </main>
    </>
  );
}
