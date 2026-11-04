# Mandatory Plan Approval & Stop Mechanism

## 🛑 Strict Rule: Never Implement Without Explicit User Approval

1. **Mandatory Stop After Planning**:
   - Whenever an implementation plan is created (or whenever a task requires planning and architectural design), you MUST STOP immediately after writing the plan.
   - Do NOT proceed to implementation in the same turn.

2. **Zero Source Code Changes Before Confirmation**:
   - You MUST NOT create new source files, modify existing code, run database migrations, or execute modifying commands until the user has reviewed the plan and explicitly given confirmation (e.g., "Approved", "Proceed", "ابدأ التنفيذ", or "Go ahead").

3. **No Implicit Approvals**:
   - Never assume user approval or combine planning and execution into a single step without user interaction.
