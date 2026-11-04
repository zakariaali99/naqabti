import { DoctorsMembershipRenewHistory } from "../models/membershipRenewHistory";

import { BaseApiClient } from "./client";

export class DoctorsMembershipRenewHistoryApiClient extends BaseApiClient<
  DoctorsMembershipRenewHistory,
  any
> {
  constructor() {
    super("membership-renew-history/");
  }
}

export const doctorsMembershipRenewHistoryApi =
  new DoctorsMembershipRenewHistoryApiClient();
