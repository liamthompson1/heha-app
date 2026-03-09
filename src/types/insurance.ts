export interface InsuranceBenefit {
  icon: string;
  text: string;
}

export interface InsuranceDocument {
  id: string;
  name: string;
  type: "pdf" | "image";
  category: "policy" | "claim" | "receipt";
  uploaded_at: string;
  size_bytes: number;
  status: "verified" | "pending" | "rejected";
}

export interface InsurancePolicy {
  id: string;
  type: "comprehensive" | "medical" | "cancellation";
  name: string;
  status: "active" | "pending" | "expired" | "claimed";
  provider: string;
  policy_number: string;
  coverage_amount: number;
  excess: number;
  start_date: string;
  end_date: string;
  benefits: InsuranceBenefit[];
  documents: InsuranceDocument[];
}

// --- Dummy data ---

export const DUMMY_DOCUMENTS: InsuranceDocument[] = [
  {
    id: "doc-1",
    name: "Policy Certificate.pdf",
    type: "pdf",
    category: "policy",
    uploaded_at: "2026-02-15",
    size_bytes: 245_000,
    status: "verified",
  },
  {
    id: "doc-2",
    name: "Travel Receipt.pdf",
    type: "pdf",
    category: "receipt",
    uploaded_at: "2026-02-20",
    size_bytes: 128_000,
    status: "pending",
  },
];

export const DUMMY_POLICIES: InsurancePolicy[] = [
  {
    id: "pol-1",
    type: "comprehensive",
    name: "Comprehensive Travel Cover",
    status: "active",
    provider: "Holiday Extras Insurance",
    policy_number: "HX-2026-004817",
    coverage_amount: 10_000_000,
    excess: 100,
    start_date: "2026-07-10",
    end_date: "2026-07-20",
    benefits: [
      { icon: "🏥", text: "Medical expenses up to £10m" },
      { icon: "✈️", text: "Cancellation cover up to £5,000" },
      { icon: "🧳", text: "Baggage & personal effects up to £2,500" },
      { icon: "⏱️", text: "Travel delay — £250 after 12 hours" },
    ],
    documents: DUMMY_DOCUMENTS,
  },
];
