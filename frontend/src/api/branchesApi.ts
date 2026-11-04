import { BaseApiClient } from "./client";

import { Branch, BranchCreateInput, BranchUpdateInput } from "@/models/branch";

class BranchesApi extends BaseApiClient<
  Branch,
  BranchCreateInput,
  BranchUpdateInput
> {
  constructor() {
    super("branches/");
  }

  // Any custom branch endpoints can be added here
  async getActiveBranches() {
    return this.getAll({ is_active: true });
  }

  /**
   * Get only top-level (parent) branches for selection dropdown
   */
  async getParentBranches() {
    return this.getAll({ parent__isnull: true });
  }

  /**
   * Build a tree structure from a flat list of branches
   */
  buildBranchTree(branches: Branch[]): Branch[] {
    const branchMap = new Map<number, Branch>();
    const rootBranches: Branch[] = [];

    // First pass: create map and initialize children arrays
    branches.forEach((branch) => {
      branchMap.set(branch.id, { ...branch, children: [], level: 0 });
    });

    // Second pass: build parent-child relationships
    branches.forEach((branch) => {
      const branchNode = branchMap.get(branch.id);

      if (!branchNode) return;

      if (branch.parent) {
        const parent = branchMap.get(branch.parent);

        if (parent) {
          branchNode.level = 1;
          parent.children = parent.children || [];
          parent.children.push(branchNode);
        } else {
          // Parent not in current list, treat as root
          rootBranches.push(branchNode);
        }
      } else {
        // No parent, this is a root branch
        rootBranches.push(branchNode);
      }
    });

    return rootBranches;
  }

  /**
   * Flatten a tree structure back to a list (useful for display)
   */
  flattenBranchTree(tree: Branch[]): Branch[] {
    const result: Branch[] = [];

    const flatten = (branches: Branch[]) => {
      branches.forEach((branch) => {
        result.push(branch);
        if (branch.children && branch.children.length > 0) {
          flatten(branch.children);
        }
      });
    };

    flatten(tree);

    return result;
  }
}

export default new BranchesApi();
