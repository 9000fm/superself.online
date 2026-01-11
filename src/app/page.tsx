import TunnelCanvas from "@/components/TunnelCanvas";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <TunnelCanvas className="absolute inset-0" />
    </main>
  );
}
