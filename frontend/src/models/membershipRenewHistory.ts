export interface DoctorsMembershipRenewHistory {
  id: number;
  membership: number;
  renew_date: string;
  previous_end_date: string | null;
  new_end_date: string;
  amount: number;
  paid_amount: number;
  payment_status: "unpaid" | "partial" | "paid";
  notes: string | null;
}
