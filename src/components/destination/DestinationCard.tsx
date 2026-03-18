import Link from "next/link";
import type { Destination } from "@/types/destination";

export default function DestinationCard({
  destination,
}: {
  destination: Destination;
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="hx-glass hx-glass-hover"
      style={{
        display: "block",
        overflow: "hidden",
        textDecoration: "none",
        padding: 0,
        borderRadius: 20,
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        {destination.hero_image_url ? (
          <img
            src={destination.hero_image_url}
            alt={destination.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.03)",
              fontSize: 40,
              color: "rgba(255,255,255,0.1)",
            }}
          >
            🌍
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(5,5,16,0.8) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: "16px 20px 20px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.32)",
          }}
        >
          {destination.country} · {destination.continent}
        </p>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#f5f5f7",
            marginTop: 4,
            letterSpacing: "-0.02em",
          }}
        >
          {destination.name}
        </h3>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.56)",
            marginTop: 6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {destination.summary}
        </p>
        {destination.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
            {destination.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "2px 8px",
                  borderRadius: 980,
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
