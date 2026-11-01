# WebPilot — the Browser Agent That Knows When to Ask a Human

AI agents can now drive real browsers — clicking, typing, and completing multi-step web tasks. The hard part isn't the clicking; it's knowing where the agent must stop. **WebPilot** is a demo of that pattern: an agent that performs web tasks end to end and **hands control to a human for the sensitive steps** — sign-ins, CAPTCHAs, payments — instead of guessing with your credentials.

Built with **Next.js + TypeScript**. No API keys needed to run the demo.

## Try it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Two tasks are built in:

1. **Sign up for the Acme Notes free trial** — the agent navigates, fills the signup form, then hits an SSO sign-in and *pauses*. You click "I've signed in — hand control back," and the agent resumes: picks the Pro trial and verifies the welcome page shows the right account.
2. **Checkout-flow check on ShopDemo** — a QA-style run: the agent buys a product in test mode and verifies every total and the confirmation code, ending in a pass/fail report a product team can use after each deploy.

Every step lands in the agent log with its action type (`navigate`, `click`, `type`, `verify`, `handoff`), and each run ends with a verification report: checks passed, steps taken, handoffs used.

## The pattern

```
Task ──▶ Planner ──▶ Steps ──▶ Browser driver ──▶ Verify ──▶ Report
                        │
                        └─ handoff step ──▶ Human (sign-in / approval) ──▶ resume
```

- The agent does the tedious 95%; a human does the sensitive 5%.
- Credentials never pass through the agent — the same governance idea as per-tool approvals in MCP Guard, one layer up (browser actions instead of tool calls).

## From demo to production

The demo drives a simulated site with deterministic plans so it runs anywhere. The step + handoff contract is the production contract:

- **Planner:** swap the built-in plans for an LLM planner — e.g. LangChain's Managed Deep Agents (v0.10 added browser control with human sign-in handoff and parallel background subagents).
- **Driver:** swap the mock browser for Playwright or a hosted browser (Browserbase/Steel) against real sites.
- **Verification:** keep the checks — an agent run without a verified end state is a demo, not a product.
- **Scale:** run independent tasks as parallel background subagents, each with its own log and report.

## Project layout

- `src/lib/tasks.ts` — task plans: steps, handoff points, and verification checks.
- `src/app/page.tsx` — the agent console: mock browser, run controls, live agent log, and the end-of-run report.

## License

MIT
