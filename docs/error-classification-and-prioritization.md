# 🎯 Error Classification & Prioritization (Merged Raw + Visual)

> A single user-friendly document combining the original raw prompt, the refactored 10-dimension system, and a color-coded visual issue snapshot.

---

## 🧩 Mission + Raw Prompt

This document merges the exact original brief with a human-centric visual scoring system.

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


> 📌 Backup of the raw source is saved as `docs/error-classification-and-prioritization_raw.md`.

---

## 🌈 1. Why this version exists

- Merges the original raw requirements with a polished visual layout.
- Keeps the scoring math exact while making it faster to read.
- Adds color and category markers so reviewers can scan issues quickly.
- Preserves the full formula, override rules, and human sanity checks.

---

## 🧭 2. The Refactored Scoring System

### 🎨 Dimension Dashboard

| # | Dimension | What it measures | Points | Weight | Quick check |
|---|-----------|------------------|--------|--------|-------------|
| 1 | 🔥 Severity | How bad is the failure? | 0 / 3 / 6 / 10 | 3.0 | Is it crash/data loss? |
| 2 | 👥 User Impact | How many users feel it? | 0 / 3 / 6 / 10 | 2.5 | Analytics or support volume? |
| 3 | ⏱ Frequency | How often it happens | 0 / 3 / 7 / 10 | 1.5 | Logs or repeat steps? |
| 4 | 🛡 Security | Risk or compliance gaps | 0 / 4 / 7 / 10 | 4.0 | Data leak or breach possible? |
| 5 | 😠 Sentiment | How annoying it feels | 0 / 3 / 6 / 9 | 2.0 | Tickets or feedback say angry? |
| 6 | 🚀 Timing | Does release schedule care? | 0 / 3 / 6 / 10 | 2.0 | Launch blocker or runway issue? |
| 7 | 🧱 Fragility | How risky the fix is | 0 / 3 / 7 / 10 | 1.0 | Is this a fragile core area? |
| 8 | 🔎 Diagnostics | How hard to find it | 0 / 4 / 8 / 10 | 0.8 | Easy trace or random failure? |
| 9 | 💬 Morale | Team burnout impact | 0 / 3 / 6 / 10 | 0.5 | Does it drain the team? |
| 10 | 🕵️ Silent Damage | Hidden corruption risk | 0 / 4 / 8 / 10 | 2.5 | Could it silently break data? |

> Max raw score = **198** → normalized to **0–100**.

---

## 🚦 3. Priority Tiers + Override Logic

| Score | Tier | Label | Humans do this |
|------|------|-------|----------------|
| **80–100** | 🔴 Critical | <span style="background:#FFE5E5;color:#B10000;padding:0.2em 0.4em;border-radius:0.3em;">CRITICAL</span> | Stop work, fix now, verify with 2 people |
| **60–79** | 🟠 High | <span style="background:#FFF0D6;color:#A35000;padding:0.2em 0.4em;border-radius:0.3em;">HIGH</span> | Next sprint, team lead sign-off |
| **35–59** | 🟡 Medium | <span style="background:#FFFBDB;color:#8A6D00;padding:0.2em 0.4em;border-radius:0.3em;">MEDIUM</span> | Next planning cycle |
| **15–34** | 🟢 Low | <span style="background:#E8F7E6;color:#2D6A2D;padding:0.2em 0.4em;border-radius:0.3em;">LOW</span> | Backlog, monthly review |
| **0–14** | ⚪ Trivial | <span style="background:#F2F4F7;color:#5B6675;padding:0.2em 0.4em;border-radius:0.3em;">TRIVIAL</span> | Defer unless override triggers |

### ⚠️ Override rules (built in)
- `Security ≥ 7` → **Critical**
- `Silent Damage ≥ 8` → **Critical**
- `Sentiment ≥ 9 AND Frequency ≥ 7` → **High**

> These rules are automatic to prevent bias and gaming.

---

## 🧠 4. Human sanity checks

- Use the **lowest score that still fits reality**.
- Prefer **data over opinion**: logs, tickets, analytics.
- Ask: “Would I want this fixed before next release?”
- Add one short evidence note per issue.
- Calibrate with **5 example issues** first.

---

## 🚀 5. How to use it in 90 seconds

1. Pick the issue.
2. Assign each dimension a point level.
3. Multiply by the weight.
4. Add weighted values → raw score.
5. Normalize by `198`, multiply by `100`.
6. Apply override rules.
7. Assign tier using the table.
8. Add a one-line evidence note.

> Keep the formula hidden and expose only the 0/3/6/10 choices to avoid overthinking.

---

## 📌 6. Current Repo Issue Snapshot

### Medium / High Visibility

| # | Issue | Outcome | Tier | Category | Why |
|---|-------|---------|------|----------|-----|
| 1 | `next-auth/jwt` missing | auth build risk | <span style="background:#FFF0D6;color:#A35000;padding:0.2em 0.4em;border-radius:0.3em;">🟠 High</span> | <span style="color:#A35000;font-weight:600;">Build</span> | auth dependency failure impacts login flow |
| 2 | Docker/local DB not available | dev blocker | <span style="background:#FFF0D6;color:#A35000;padding:0.2em 0.4em;border-radius:0.3em;">🟠 High</span> | <span style="color:#A35000;font-weight:600;">Dev DX</span> | blocks local verification for contributors |
| 3 | Cesium per-frame allocations | perf hotspot | <span style="background:#FFFBDB;color:#8A6D00;padding:0.2em 0.4em;border-radius:0.3em;">🟡 Medium</span> | <span style="color:#8A6D00;font-weight:600;">Performance</span> | runtime stress and user slowdown |
| 4 | `@sentry/nextjs` missing | build failure | <span style="background:#E8F7E6;color:#2D6A2D;padding:0.2em 0.4em;border-radius:0.3em;">🟢 Low</span> | <span style="color:#2D6A2D;font-weight:600;">Build</span> | bundler issue likely fixable quickly |
| 5 | Turbopack root warning | config noise | <span style="background:#F2F4F7;color:#5B6675;padding:0.2em 0.4em;border-radius:0.3em;">⚪ Trivial</span> | <span style="color:#5B6675;font-weight:600;">Config</span> | developer experience issue only |

### Low / Trivial but worth noting

| # | Issue | Category | Why it matters |
|---|-------|----------|----------------|
| 6 | Large audit doc bulk | <span style="color:#5B6675;font-weight:600;">Docs</span> | cognitive overload, repo noise |
| 7 | duplicate `vite` package | <span style="color:#5B6675;font-weight:600;">Tech Debt</span> | small tech debt, already fixed |
| 8 | uncommitted local edits | <span style="color:#5B6675;font-weight:600;">Process</span> | risk of lost work |
| 9 | Git path warnings on Windows | <span style="color:#5B6675;font-weight:600;">DX</span> | local developer friction |

---

## 🛠 7. Quick actions

- **Critical path:** fix missing auth/build deps and Docker/dev setup.
- **Important follow-up:** keep `worldwideview/` out of the repo tree and document local DB optionality.
- **Easy win:** add a dev note to `README.md` and clean up build warnings.
- **UX note:** use the color table when creating issue tracker labels.

---

## ✅ 8. Why this merged version

- Keeps the full original prompt and refactored system.
- Adds color-coded categories and visual tags.
- Still fits on one readable page.
- Makes both the formula and human workflow easy to use.

If you want, I can also add a small “issue scoring worksheet” table to the bottom so you can fill in new problems directly in this doc.
