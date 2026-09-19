import { partners } from "@/data/gallery";

// Trusted corporate partners marquee (duplicated for seamless scroll).
export default function Partners() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container-px">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
          These Companies Trusted Us as Their Corporate Trek Partner
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 opacity-70">
          {[...partners, ...partners].map((p, i) => (
            <img key={i} src={p} alt="Partner" className="h-10 w-auto grayscale hover:grayscale-0 transition" />
          ))}
        </div>
      </div>
    </section>
  );
}
