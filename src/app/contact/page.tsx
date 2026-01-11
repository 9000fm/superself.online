export default function Contact() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-mono tracking-[0.3em] text-white mb-4">
          CONTACT
        </h1>
        <div className="space-y-2">
          <a
            href="mailto:hello@superself.online"
            className="block text-[#0000FF] font-mono text-sm tracking-wider hover:text-white transition-colors"
          >
            hello@superself.online
          </a>
          <a
            href="https://instagram.com/superself__"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-white/50 font-mono text-sm tracking-wider hover:text-[#0000FF] transition-colors"
          >
            @superself__
          </a>
        </div>
      </div>
    </main>
  );
}
