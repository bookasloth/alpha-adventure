// Reusable section heading used across the site.
export default function SectionHeading({ eyebrow, title, subtitle, center = true, className = "" }) {
  return (
    <div className={`${center ? "text-center" : ""} max-w-3xl ${center ? "mx-auto" : ""} mb-10 ${className}`}>
      {eyebrow && (
        <span className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-2">
          {eyebrow}
        </span>
      )}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="mt-3 text-gray-600 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
