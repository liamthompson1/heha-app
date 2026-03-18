"use client";

import { formatDateRange } from "@/lib/format-date";

interface InsuranceBannerProps {
  destination: string;
  startDate?: string;
  endDate?: string;
}

export default function InsuranceBanner({ destination, startDate, endDate }: InsuranceBannerProps) {
  const dateRange = formatDateRange(startDate, endDate);

  return (
    <div className="insurance-banner">
      <div className="insurance-banner-content">
        <span className="insurance-banner-icon">{"\u{1F6E1}\uFE0F"}</span>
        <div>
          <h1 className="insurance-banner-title">Insurance &amp; Protection</h1>
          <p className="insurance-banner-subtitle">
            {destination}
            {dateRange ? ` \u00B7 ${dateRange}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
