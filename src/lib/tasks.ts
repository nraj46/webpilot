/**
 * WebPilot task definitions.
 *
 * Each task is a plan: a sequence of browser steps the agent executes against
 * a target site. A step can be a `handoff` — the agent pauses and a human
 * completes that step (sign-ins, CAPTCHAs, payments) before the agent resumes.
 * This mirrors LangChain Deep Agents v0.10-style browser agents: an LLM
 * planner produces the steps in production; here the plans are deterministic
 * so the demo runs with no API keys. The step contract stays the same.
 */

export interface Step {
  action: "navigate" | "click" | "type" | "verify" | "handoff" | "read";
  description: string;
  page: string;
  field?: string;
  value?: string;
  delayMs: number;
}

export interface TaskDef {
  id: string;
  title: string;
  site: string;
  goal: string;
  steps: Step[];
  checks: string[];
}

export const TASKS: TaskDef[] = [
  {
    id: "acme-signup",
    title: "Sign up for the Acme Notes free trial",
    site: "acme-notes.app",
    goal: "Create an account, complete SSO sign-in (human handoff), start the Pro trial, and verify the welcome page.",
    checks: [
      "Signup form accepted the email",
      "SSO sign-in completed via human handoff",
      "Pro trial plan selected (14 days free)",
      "Welcome page shows the correct account",
    ],
    steps: [
      { action: "navigate", description: "Navigate to acme-notes.app", page: "acme-home", delayMs: 900 },
      { action: "click", description: "Click “Start free trial”", page: "acme-signup", delayMs: 1100 },
      { action: "type", description: "Type email: alex.morgan@demo.com", page: "acme-signup", field: "email", value: "alex.morgan@demo.com", delayMs: 1200 },
      { action: "click", description: "Click “Continue with Google”", page: "acme-sso", delayMs: 1000 },
      {
        action: "handoff",
        description:
          "HANDOFF — the site requires an SSO sign-in. WebPilot never types passwords or completes sign-ins: a human takes over for this step.",
        page: "acme-sso",
        delayMs: 600,
      },
      { action: "verify", description: "Sign-in detected — session belongs to alex.morgan@demo.com", page: "acme-plan", delayMs: 1000 },
      { action: "click", description: "Select “Pro — start 14-day free trial”", page: "acme-welcome", field: "plan", value: "Pro trial", delayMs: 1200 },
      { action: "verify", description: "Verify welcome page: account email and Pro trial status are correct", page: "acme-welcome", delayMs: 900 },
    ],
  },
  {
    id: "shopdemo-checkout",
    title: "Run a checkout-flow check on ShopDemo",
    site: "shopdemo.store",
    goal: "Buy the Aurora Lamp in test mode and verify every total — the kind of smoke test a product team runs after each deploy.",
    checks: [
      "Product page loads with the correct price ($49)",
      "Cart total matches the product price",
      "Checkout accepts the test order",
      "Confirmation code issued (SD-2481)",
    ],
    steps: [
      { action: "navigate", description: "Navigate to shopdemo.store", page: "shop-home", delayMs: 900 },
      { action: "click", description: "Open “Aurora Lamp — $49”", page: "shop-product", delayMs: 1000 },
      { action: "click", description: "Click “Add to cart”", page: "shop-cart", field: "cart", value: "1 item", delayMs: 1100 },
      { action: "click", description: "Click “Checkout”", page: "shop-checkout", delayMs: 1000 },
      { action: "type", description: "Fill shipping details (test data)", page: "shop-checkout", field: "shipping", value: "Alex Morgan, 4210 McKinney Ave, Dallas TX", delayMs: 1300 },
      { action: "click", description: "Click “Place order — test mode”", page: "shop-report", field: "order", value: "SD-2481", delayMs: 1200 },
      { action: "verify", description: "Verify totals: $49 + $5 shipping = $54, confirmation SD-2481 issued", page: "shop-report", delayMs: 900 },
    ],
  },
];
