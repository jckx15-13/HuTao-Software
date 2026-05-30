# Error Classification & Prioritization

This document contains a human-centric error classification and prioritization system (pasted verbatim from the supplied final prompt/structure) and a practical, worked categorization of the current repository issues against that system.

---

## Final Prompt (briefing to a team/system)

> **"Design a human-centric, psychologically sound issue prioritization system for an application's negative aspects. It must:**
> 
> 1. **Combine** at least 14 orthogonal dimensions (severity, user impact, frequency, reproducibility, security/compliance, technical debt, fix fragility, diagnostic difficulty, user sentiment, market timing, team morale, ecosystem impact, silent damage, user sophistication).  
> 2. **Assign integer points (0–10)** for each dimension with explicit weights (e.g., security weight 4.0, team morale weight 0.5) to produce a raw score, normalized to 0–100.  
> 3. **Include mandatory overrides** (security ≥7, data loss ≥8, scale + severity combo, user sentiment + frequency combo) to close loopholes.  
> 4. **Acknowledge and fix** common impracticalities: cognitive overload, bias, scalability, lack of context, and misalignment with human motivation.  
> 5. **Draw inspiration** from education grading, HR performance reviews, and business appraisals to ensure fairness, objectivity, and adaptability.  
> 6. **Be humanly possible** to use without software—should fit on one page, limit mental effort, and include a lightweight check for bias.  
> 
> **Output**: A one-page summary table with dimensions, point levels, weights, overrides, and a 'human sanity check' step. Explain why earlier versions (like the 14-dimension raw formula) were impractical and how you refactored them.

---

## Final Structure (Refactored, Human-Centric Version)

### I. The Refactored Dimension Set (Simplified → 10 dimensions, not 14)

**Why reduce?** Cognitive load research shows humans can handle about 7±2 factors before decision quality drops. Also, HR and education systems rarely use more than 5–8 criteria.

| # | Dimension | Points (0–10) | Weight | Human Check |
|---|-----------|---------------|--------|-------------|
| 1 | **Severity** | 0=cosmetic, 3=minor, 6=major, 10=crash/data loss | 3.0 | Is this really a crash? |
| 2 | **User Impact** | 0=<1%, 3=1–10%, 6=10–50%, 10=>50% | 2.5 | Verify with analytics, not guess |
| 3 | **Frequency** | 0=rare, 3=occasional, 7=frequent, 10=always | 1.5 | Use logs, not reports |
| 4 | **Security/Compliance** | 0=none, 4=minor risk, 7=policy violation, 10=exploit | 4.0 | Override if ≥7 → Critical |
| 5 | **User Sentiment** | 0=none, 3=annoyed, 6=frustrated, 9=trust loss | 2.0 | Survey or support tickets |
| 6 | **Business Timing** | 0=no deadline, 3=low, 6=moderate, 10=blocking launch | 2.0 | Check roadmap |
| 7 | **Fix Fragility** | 0=safe, 3=low risk, 7=high risk, 10=core dependency | 1.0 | Ask dev lead |
| 8 | **Diagnostic Difficulty** | 0=obvious, 4=needs logs, 8=needs debug, 10=random | 0.8 | Bracket estimate |
| 9 | **Team Morale Drain** | 0=few hours, 3=half day, 6=days, 10=weeks | 0.5 | Ask team (avoid heroism) |
| 10 | **Silent Damage** | 0=none, 4=minor inconsistency, 8=data corruption | 2.5 | Override if ≥8 → Critical |

**Total max raw score** = 10 × (3+2.5+1.5+4+2+2+1+0.8+0.5+2.5) = 10 × 19.8 = 198  
**Normalized** = (raw / 198) × 100

---

### II. Priority Tiers (with Bias Mitigation)

| Normalized Score | Tier | Action | Human Intervention |
|------------------|------|--------|-------------------|
| ≥80 | Critical | Stop progress, fix immediately | Must be confirmed by two independent people |
| 60–79 | High | This sprint | Team lead signs off |
| 35–59 | Medium | Next sprint | No sign-off needed |
| 15–34 | Low | Backlog | Monthly review |
| <15 | Trivial | Defer forever | Only if no override triggered |

**Override rules** (from previous but now enforced with a human sanity check):
- Security ≥7: Critical (but must confirm it’s not a false positive)
- Silent Damage ≥8: Critical (verify with data team)
- User Sentiment ≥9 AND Frequency ≥7: High (check support tickets – is it a vocal minority?)

---

### III. Human-Centric Additions (fixing impracticalities)

| Impracticality (from earlier) | Fix (from psychology/HR/education) |
|------------------------------|-----------------------------------|
| **14 dimensions too complex** | Reduced to 10 – fits Miller’s Law (7±2) |
| **Subjectivity / bias** | Add “human sanity check” column – require data source per dimension |
| **Scalability (large teams)** | Use a shared spreadsheet with locked formulas – no debate on scores |
| **No context (team morale)** | Added Team Morale Drain dimension with weight 0.5 – prevents overwork burnout |
| **Cognitive overload (points + weights)** | Pre-calculate weights in tool; humans only assign 0–10 for each dimension |
| **False precision (decimal scores)** | Use only integer points (0,3,6,10) – reduces granularity arguments |
| **Gaming the system** | Override rules are automatic, not discretionary – prevent escalation inflation |
| **Ignoring hidden damage** | Silent Damage dimension with weight 2.5 – surfaces silent corruption |
| **HR insight: recency bias** | Score based on last 30 days of data only – no “old bug” inflation |
| **Education insight: norming** | Before using system, calibrate team with 5 example issues – train to consistency |
| **Business insight: regret minimization** | After scoring, ask “If we don’t fix this and it gets worse, how bad would we feel?” – adjust tier up if regret high |

---

### IV. One-Page Usage Instructions

1. **Gather data** (logs, support tickets, code review) – do not score from memory.  
2. **For each dimension**, pick the closest point level (0, 3, 6, 10 – or 0,4,7,10 for security).  
3. **Multiply by weight** (pre‑computed in spreadsheet).  
4. **Sum** all weighted scores → raw score.  
5. **Normalize** (raw/198 × 100).  
6. **Check overrides** – if any override triggers, set tier to Critical/High regardless.  
7. **Apply human sanity check** – confirm each score with evidence.  
8. **Assign final tier** using the table.  
9. **Review monthly** – re-evaluate low and trivial issues for new impact.

---

## Categorization of Current Repository Issues

Below are practical categorizations of the *current, actionable issues* observed during the scan and dev runs. For each issue I list the 10-dimension point assignments, the raw weighted score, normalized score (0–100), the tier, whether any override triggers, and a short recommended action.

> Notes: Normalization denominator = 198 (10 × 19.8). Points mostly use integer levels consistent with the system (0,3,6,10) or near values where appropriate. The listed issues reflect the recent workspace and the cloned `worldwideview` run: build/runtime errors, git noise, performance hotspots, and repo hygiene items.

---

1) Issue: `next` dev - Module not found `@sentry/nextjs` (Next build failure)

- Points (Severity, UserImpact, Frequency, Security, Sentiment, Business, Fragility, Diagnostic, TeamMorale, SilentDamage):
- (6, 3, 7, 0, 0, 3, 3, 4, 3, 0)

- Raw = **49.7** → Normalized = **25.1**  → **Tier: Low (15–34)**
- Overrides: none.  
- Recommended action: verify dependency resolution/hoisting and run bundler diagnostics; quick fix expected.

---

2) Issue: `next` dev - Module not found `next-auth/jwt` (auth build failure)

- Points: (6, 6, 7, 4, 3, 3, 3, 4, 4, 1)

- Raw = **82.2** → Normalized = **41.5**  → **Tier: Medium (35–59)**
- Overrides: none (Security < 7).  
- Recommended action: ensure `next-auth` resolution across workspace; if auth fails in production, escalate to High.

---

3) Issue: Docker not running → `predev` DB startup fails (Prisma `db push` fails)

- Points: (10, 3, 10, 0, 0, 6, 3, 2, 3, 0)

- Raw = **70.6** → Normalized = **35.7**  → **Tier: Medium (35–59)**
- Recommended action: start/install Docker Desktop or provide external `DATABASE_URL`; document local dev prerequisites.

---

4) Issue: Turbopack/Next workspace root warning (lockfile detection)

- Points: (3, 0, 3, 0, 0, 0, 1, 2, 1, 0)

- Raw = **16.6** → Normalized = **8.4**  → **Tier: Trivial (<15)**
- Recommended action: set `turbopack.root` in `next.config.ts` or clean up lockfiles.

---

5) Issue: silver-wolf-vi dev server probe returned HTTP 404 (missing index/route)

- Points: (6, 6, 3, 0, 4, 3, 2, 4, 1, 0)

- Raw = **57.2** → Normalized = **28.9**  → **Tier: Low (15–34)**
- Recommended action: inspect Vite/Next base path, routing config and logs.

---

6) Issue: Large `docs/audit-1000-negatives.md` — repo/context bloat and cognitive overload

- Points: (4, 2, 1, 0, 2, 0, 1, 2, 2, 0)

- Raw = **26.1** → Normalized = **13.2**  → **Tier: Trivial**
- Recommended action: archive or move to a separate branch/folder to reduce noise.

---

7) Issue: Duplicate `vite` entry in `package.json` (technical debt) — already fixed

- Points: (2, 0, 0, 0, 0, 0, 0, 0, 0, 0)

- Raw = **6** → Normalized = **3.0**  → **Tier: Trivial**

---

8) Issue: Uncommitted modified files in `src` (risk of lost work / diverging branches)

- Points: (4, 0, 3, 0, 0, 0, 2, 2, 1, 0)

- Raw = **20.6** → Normalized = **10.4**  → **Tier: Trivial**
- Recommended action: review diffs, run lint/typecheck, commit with clear messages.

---

9) Issue: Cesium background: heavy per-frame allocations / CPU hotspots (rendering performance)

- Points: (7, 6, 10, 0, 6, 3, 6, 6, 2, 1)

- Raw = **83.3** → Normalized = **42.1**  → **Tier: Medium (35–59)**
- Recommended action: offload math to a WebWorker, continue buffer reuse, add perf budgets and fallbacks.

---

10) Issue: Git status produced permission / filename-too-long warnings when scanning local caches

- Points: (3, 1, 1, 0, 1, 0, 2, 2, 1, 0)

- Raw = **17.1** → Normalized = **8.6**  → **Tier: Trivial**
- Recommended action: add problematic directories to `.gitignore` or `.git/info/exclude`, enable long paths on Windows.

---

## Next steps (recommended)

1. Triage the two Medium items (`next-auth` resolution and Cesium perf) into the next planning cycle and assign owners.  
2. Document the Docker/local DB requirement in `README.md` and provide a `WWV_SKIP_LOCAL_DB` note for local dev.  
3. Commit/PR the small DX fixes (Turbopack root, `.gitignore` entries) and archive large audit artifacts if not needed.  
4. Run `npm run lint` / typecheck in this workspace and open a follow-up PR for low-risk fixes.

If you want, I will commit this file and open a PR with a short checklist for the Medium items and the local-Docker README note.
