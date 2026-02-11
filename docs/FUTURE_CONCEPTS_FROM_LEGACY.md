# Future Concepts — Innovations from Legacy Plans

**Created:** 2026-02-10
**Source:** Legacy plans archived in `docs/legacy/`
**Purpose:** Capture ideas from the original FlavioValle planning process that could improve our standard plan/discovery templates in the future.

---

## Context

The original FlavioValle plans were created on a different machine without the standard prova-ai workflow parameters. While they didn't follow the standard format, they introduced several innovations worth preserving for future template improvements.

**Action:** Review these concepts periodically. When updating `.claude/commands/plan.md` or `.claude/commands/discover.md`, consider incorporating the ones marked as "Recommended."

---

## Concept 1: Phase Dependency Graph

**Status:** Recommended for standard template
**Source:** `wix-registration-system.md` lines 281-286

**What it is:** Explicit notation showing which phases can run in parallel vs sequentially:
```
P1 → P2A ∥ P2B → P3 → P4 → P5
```

**Why it's valuable:** The standard template's Phase 1/2/3 structure is strictly sequential and doesn't support parallel execution tracks. Real projects often have parallelizable work (e.g., frontend and discovery running simultaneously).

**How to adopt:** Add a "Phase Dependencies" sub-section to Section 6 (Implementation Phases) of `plan.md` with a simple graph notation.

---

## Concept 2: Sub-Discovery for Complex Phases

**Status:** Recommended for standard template
**Source:** `clarify-session.md` lines 473-811 (Phase 2A sub-discovery, 25 questions)

**What it is:** When a planned phase reveals significant unknowns (new external system, unfamiliar technology, API that needs exploration), run a focused sub-discovery of 10-25 questions BEFORE attempting that phase.

**Why it's valuable:** The standard one-shot discovery assumes all questions can be answered upfront. This fails for exploratory tasks where you discover unknowns only after starting.

**How to adopt:** Add a guideline to `discover.md` permitting recursive discovery. Document as a new section within the same discovery file, not as a separate file.

---

## Concept 3: Emerging Requirements Synthesis

**Status:** Recommended for standard template
**Source:** `clarify-session.md` lines 321-456

**What it is:** After completing all Q&A, synthesize the raw answers into structured categories:
- System Architecture
- Technical Constraints
- User Experience Requirements
- Edge Cases & Error Handling
- Out of Scope
- Success Metrics

**Why it's valuable:** Raw Q&A (56 questions) is hard to consume. The synthesis transforms it into plan-ready input. The standard discovery output is just a category-by-category summary, which is less actionable.

**How to adopt:** Add an "Emerging Requirements" template to the discover command's completion output.

---

## Concept 4: Maintenance & Handoff Section

**Status:** Recommended for standard template
**Source:** `wix-registration-system.md` lines 1752-1765

**What it is:** Explicit planning for post-delivery maintenance:
- How to update credentials
- How to check sync status
- How to manually trigger retries
- Troubleshooting guide
- Rollback procedure
- Contact info for support

**Why it's valuable:** Projects handed off to non-technical users need explicit maintenance planning. The standard template doesn't prompt for this.

**How to adopt:** Add Section 11 "Maintenance & Handoff" to `plan.md` with sub-sections: Documentation Required, Maintenance Owner, Knowledge Transfer.

---

## Concept 5: Existing Code Inventory

**Status:** Consider for standard template
**Source:** `wix-registration-system.md` lines 136-149

**What it is:** Explicit section documenting what code/components already exist and can be reused, OR explicitly stating "brand new project — no existing code."

**Why it's valuable:** Forces consideration of what already exists before building from scratch. Avoids reinventing the wheel.

**How to adopt:** Add "3.5 Existing Code to Reuse" sub-section to Section 3 (Technical Architecture) of `plan.md`.

---

## Concept 6: Screenshot Milestone Planning

**Status:** Consider for standard template (domain-specific)
**Source:** `form-discovery-implementation.md` lines 334-342

**What it is:** Pre-define exactly which screenshots to capture at what stage:
- `output/01-landing-page.png` — initial load
- `output/02-after-login.png` — after successful login
- `output/03-registration-form.png` — form page
- `output/04-error-*.png` — error states

**Why it's valuable:** For browser automation and UI testing projects, screenshot milestones are essential for debugging and verification. Systematic capture ensures evidence is collected.

**How to adopt:** Optional sub-section for tasks involving browser automation or visual testing.

---

## Concept 7: CLI Interface Design in Plans

**Status:** Consider for standard template (domain-specific)
**Source:** `form-discovery-implementation.md` lines 213-218

**What it is:** Design CLI flags and arguments as part of the plan:
- `--headless` / `--headful`
- `--log-level=minimal|standard|verbose|debug`

**Why it's valuable:** CLI tools benefit from having their interface designed upfront. Prevents ad-hoc flag accumulation during implementation.

**How to adopt:** Optional sub-section for tasks that produce CLI tools.

---

## Concept 8: Automated vs Manual Verification Split

**Status:** Consider for standard template
**Source:** `wix-registration-system.md` lines 1555-1626

**What it is:** Explicitly separate verification into:
- **Automated:** Unit tests, integration tests, linting
- **Manual:** Cross-browser testing, mobile testing, user acceptance testing, performance testing

**Why it's valuable:** The standard bundles all testing into Section 5 without this distinction. The split makes it clear what can be automated vs what needs human eyes.

**How to adopt:** Add "5.4 Verification Plan" to `plan.md` with Automated/Manual sub-sections.

---

## Concept 9: Critical Files Consolidated Table

**Status:** Consider for standard template
**Source:** `wix-registration-system.md` lines 1509-1533

**What it is:** A single reference table listing ALL files involved in the project:

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `file.js` | Does X | Create from scratch |

**Why it's valuable:** The standard distributes file references across feature breakdowns. A consolidated table gives a single-glance view of all files.

**How to adopt:** Optional companion section to Section 4 (Feature Breakdown).

---

## Concept 10: Preference Questions in Discovery

**Status:** Selective adoption recommended
**Source:** `clarify-session.md` — Preferences category (18 questions, Q37-Q45)

**Valuable questions to add to standard Constraints & Boundaries category:**
- "What is your top priority: speed of delivery, quality, or cost?"
- "Are there specific technologies to AVOID?"
- "What is the timeline constraint?"
- "Who will maintain this after delivery?"

**Not valuable (over-represented in legacy):**
- The remaining 14 preference questions were too granular for a standard template

**How to adopt:** Add 3-4 targeted questions to the "Constraints & Boundaries" category in `discover.md`.

---

## Review Schedule

These concepts should be reviewed when:
1. Updating the standard `plan.md` or `discover.md` templates
2. Starting a new large project that could benefit from these patterns
3. Post-mortem analysis identifies gaps in current templates
