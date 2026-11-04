import {
  MembershipTypeModel,
  CreateMembershipTypeRequest,
  UpdateMembershipTypeRequest,
} from "../models/membershipTypes";

import { BaseApiClient } from "./client";

class MembershipTypesApiClient extends BaseApiClient<
  MembershipTypeModel,
  CreateMembershipTypeRequest,
  UpdateMembershipTypeRequest
> {
  constructor() {
    super("membership-types/");
  }
}

export const membershipTypesApi = new MembershipTypesApiClient();
export default membershipTypesApi;
