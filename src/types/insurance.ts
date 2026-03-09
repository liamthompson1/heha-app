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
  file?: File;
  objectUrl?: string;
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

