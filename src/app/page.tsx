"use client";

import { useEffect, useRef, useState } from "react";
import { TASKS, type TaskDef } from "@/lib/tasks";

interface LogEntry {
  at: string;
  action: string;
  description: string;
  kind: "step" | "handoff" | "done";
}

type Status = "idle" | "running" | "waiting" | "done";

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export default function Home() {
  const [task, setTask] = useState<TaskDef>(TASKS[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [page, setPage] = useState("blank");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [handoffs, setHandoffs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function reset(t: TaskDef) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTask(t);
    setStatus("idle");
    setStepIdx(0);
    setPage("blank");
    setFields({});
    setLog([]);
    setHandoffs(0);
    setStartedAt(null);
    setElapsed(0);
  }

  function runFrom(t: TaskDef, from: number) {
    setStatus("running");
    let i = from;
    const advance = () => {
      if (i >= t.steps.length) {
        setStatus("done");
        if (startedAt) setElapsed(Math.round((Date.now() - startedAt) / 1000));
        setLog((l) => [
          ...l,
          { at: now(), action: "report", description: "Task complete — all verification checks passed.", kind: "done" },
        ]);
        return;
      }
      const step = t.steps[i];
      setPage(step.page);
      if (step.field) setFields((f) => ({ ...f, [step.field as string]: step.value ?? "" }));
      setLog((l) => [
        ...l,
        {
          at: now(),
          action: step.action,
          description: step.description,
          kind: step.action === "handoff" ? "handoff" : "step",
        },
      ]);
      setStepIdx(i + 1);
      i += 1;
      if (step.action === "handoff") {
        setHandoffs((h) => h + 1);
        setStatus("waiting");
        return; // pause until the human resumes
      }
      timers.current.push(setTimeout(advance, step.delayMs));
    };
    advance();
  }

  function start() {
    reset(task);
    setStartedAt(Date.now());
    // runFrom reads fresh state via the task argument; start on next tick
    setTimeout(() => {
      setStartedAt(Date.now());
      runFrom(task, 0);
    }, 50);
  }

  function resume() {
    setLog((l) => [
      ...l,
      { at: now(), action: "human", description: "Human completed the sign-in step and handed control back.", kind: "step" },
    ]);
    runFrom(task, stepIdx);
  }

  const progress = task.steps.length ? Math.round((stepIdx / task.steps.length) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-zinc-950 px-6 py-10 text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          WebPilot <span className="font-normal text-zinc-500">— the browser agent that knows when to ask a human</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Give WebPilot a web task and it drives the browser itself — navigating, clicking, typing,
          verifying. When a site demands a sign-in, a CAPTCHA, or a payment, it stops and hands
          control to a human instead of guessing with your credentials. That human-in-the-loop
          pattern is how production browser agents (LangChain Deep Agents and peers) stay safe.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {TASKS.map((t) => (
          <button
            key={t.id}
            onClick={() => reset(t)}
            className={`rounded-md border px-3 py-2 text-sm ${
              task.id === t.id
                ? "border-sky-500/60 bg-sky-500/15 text-sky-200"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Mock browser */}
        <section>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 flex-1 truncate rounded-md bg-zinc-950 px-3 py-1 font-mono text-xs text-zinc-400">
                https://{task.site}
                {page !== "blank" ? `/${page}` : ""}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  status === "running"
                    ? "bg-sky-500/15 text-sky-300"
                    : status === "waiting"
                      ? "bg-amber-500/15 text-amber-300"
                      : status === "done"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {status === "idle" && "Agent idle"}
                {status === "running" && "Agent driving…"}
                {status === "waiting" && "Waiting for human"}
                {status === "done" && "Task complete"}
              </span>
            </div>
            <div className="min-h-[340px] bg-zinc-900/40 p-5">
              <MockPage page={page} fields={fields} taskId={task.id} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {status === "idle" && (
              <button onClick={start} className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-medium hover:bg-sky-500">
                ▶ Run this task
              </button>
            )}
            {status === "waiting" && (
              <button onClick={resume} className="rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-400">
                ✓ I've signed in — hand control back
              </button>
            )}
            {(status === "running" || status === "done") && (
              <button onClick={() => reset(task)} className="rounded-md border border-zinc-700 px-5 py-2.5 text-sm hover:bg-zinc-800">
                Reset
              </button>
            )}
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Step {stepIdx} of {task.steps.length} · {task.goal}
              </p>
            </div>
          </div>
        </section>

        {/* Agent log + report */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Agent log</h2>
            <div ref={logRef} className="h-[300px] space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              {log.length === 0 && <p className="text-sm text-zinc-500">Pick a task and press Run — the agent's every step lands here.</p>}
              {log.map((e, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    e.kind === "handoff"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                      : e.kind === "done"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300"
                  }`}
                >
                  <span className="mr-2 font-mono text-[11px] text-zinc-500">{e.at}</span>
                  <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] uppercase text-zinc-300">{e.action}</span>
                  {e.description}
                </div>
              ))}
            </div>
          </div>

          {status === "done" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <h3 className="mb-2 font-semibold text-emerald-300">Task report</h3>
              <ul className="space-y-1 text-sm text-zinc-300">
                {task.checks.map((c) => (
                  <li key={c}>✓ {c}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-500">
                {task.steps.length} steps · {handoffs} human handoff{handoffs === 1 ? "" : "s"} · finished in {elapsed}s
              </p>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
            <p className="mb-1 font-semibold text-zinc-200">Why the handoff matters</p>
            <p>
              Agents that type passwords or push through CAPTCHAs get accounts locked and break
              trust. WebPilot's rule is simple: the agent does the tedious 95%, and a human does the
              sensitive 5% — sign-ins, approvals, payments. It's the same pattern MCP Guard applies
              to tool calls, one layer up.
            </p>
          </div>
        </section>
      </div>

      <footer className="mt-10 text-xs text-zinc-600">
        Built with Next.js + TypeScript. The demo drives a simulated site with deterministic plans;
        in production the planner is an LLM (LangChain Deep Agents), the driver is a real browser
        (Playwright/Browserbase), and the step + handoff contract stays exactly the same.
      </footer>
    </main>
  );
}

function MockPage({ page, fields, taskId }: { page: string; fields: Record<string, string>; taskId: string }) {
  const inputCls = "w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200";
  switch (page) {
    case "acme-home":
      return (
        <div className="py-8 text-center">
          <p className="text-2xl font-bold">📝 Acme Notes</p>
          <p className="mt-2 text-sm text-zinc-400">Notes that think with you.</p>
          <span className="mt-6 inline-block rounded-md bg-sky-600 px-5 py-2.5 text-sm font-medium ring-2 ring-sky-300">Start free trial</span>
        </div>
      );
    case "acme-signup":
      return (
        <div className="mx-auto max-w-sm space-y-3 py-6">
          <p className="text-lg font-semibold">Create your account</p>
          <input className={inputCls} readOnly placeholder="Email address" value={fields.email ?? ""} />
          <div className="rounded-md bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900">Continue with Google</div>
          <p className="text-xs text-zinc-500">Free 14-day Pro trial · No card required</p>
        </div>
      );
    case "acme-sso":
      return (
        <div className="mx-auto max-w-sm space-y-3 py-6 text-center">
          <p className="text-lg font-semibold">🔐 Sign in with Google</p>
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            The agent has paused. In the real flow, you complete this sign-in yourself — your
            password never passes through the agent.
          </p>
          <p className="text-xs text-zinc-500">accounts.google.com · demo</p>
        </div>
      );
    case "acme-plan":
      return (
        <div className="space-y-3 py-4">
          <p className="text-lg font-semibold">Pick your plan</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-700 p-4"><p className="font-semibold">Basic</p><p className="text-sm text-zinc-400">Free forever</p></div>
            <div className="rounded-xl border border-sky-500 bg-sky-500/10 p-4 ring-1 ring-sky-400"><p className="font-semibold">Pro ⭐</p><p className="text-sm text-zinc-300">14 days free, then $12/mo</p></div>
          </div>
          <p className="text-xs text-zinc-500">Signed in as alex.morgan@demo.com ✓</p>
        </div>
      );
    case "acme-welcome":
      return (
        <div className="py-8 text-center">
          <p className="text-2xl font-bold">🎉 Welcome to Acme Notes Pro</p>
          <p className="mt-2 text-sm text-zinc-300">Account: alex.morgan@demo.com · Plan: Pro trial (14 days free)</p>
          <p className="mt-1 text-xs text-zinc-500">Your workspace is ready.</p>
        </div>
      );
    case "shop-home":
      return (
        <div className="py-4">
          <p className="text-lg font-semibold">🛍️ ShopDemo</p>
          <div className="mt-4 max-w-[220px] rounded-xl border border-zinc-700 p-4">
            <p className="text-3xl">💡</p>
            <p className="mt-2 font-medium">Aurora Lamp</p>
            <p className="text-sm text-zinc-400">$49</p>
          </div>
        </div>
      );
    case "shop-product":
      return (
        <div className="py-4">
          <p className="text-4xl">💡</p>
          <p className="mt-2 text-xl font-semibold">Aurora Lamp</p>
          <p className="text-sm text-zinc-400">Warm-glow desk lamp · In stock</p>
          <p className="mt-2 font-semibold">$49</p>
          <span className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium ring-2 ring-sky-300">Add to cart</span>
        </div>
      );
    case "shop-cart":
      return (
        <div className="py-4">
          <p className="text-lg font-semibold">Your cart 🛒 (1)</p>
          <p className="mt-3 text-sm text-zinc-300">Aurora Lamp — $49</p>
          <p className="text-sm text-zinc-400">Subtotal: $49</p>
          <span className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium ring-2 ring-sky-300">Checkout</span>
        </div>
      );
    case "shop-checkout":
      return (
        <div className="mx-auto max-w-sm space-y-3 py-4">
          <p className="text-lg font-semibold">Checkout (test mode)</p>
          <input className={inputCls} readOnly placeholder="Shipping address" value={fields.shipping ?? ""} />
          <p className="text-sm text-zinc-300">Items $49 · Shipping $5 · <strong>Total $54</strong></p>
          <div className="rounded-md bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium">Place order — test mode</div>
        </div>
      );
    case "shop-report":
      return (
        <div className="py-8 text-center">
          <p className="text-2xl font-bold">✅ Order confirmed</p>
          <p className="mt-2 text-sm text-zinc-300">Confirmation code: SD-2481 · Total charged (test): $54</p>
          <p className="mt-1 text-xs text-zinc-500">The agent verified this page against the expected totals.</p>
        </div>
      );
    default:
      return (
        <div className="py-10 text-center text-sm text-zinc-500">
          {taskId === "acme-signup" ? "acme-notes.app" : "shopdemo.store"} — press “Run this task” and watch the agent drive this browser.
        </div>
      );
  }
}
