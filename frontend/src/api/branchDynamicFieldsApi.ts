import { BaseApiClient } from "./client";

import {
  BranchDynamicField,
  BranchDynamicFieldCreateInput,
  BranchDynamicFieldUpdateInput,
} from "@/models/dynamicField";

class BranchDynamicFieldsApi extends BaseApiClient<
  BranchDynamicField,
  BranchDynamicFieldCreateInput,
  BranchDynamicFieldUpdateInput
> {
  constructor() {
    super("branch-dynamic-fields/");
  }

  async getByBranch(branchId: number) {
    return this.getAll({ branch: branchId });
  }
}

export default new BranchDynamicFieldsApi();
