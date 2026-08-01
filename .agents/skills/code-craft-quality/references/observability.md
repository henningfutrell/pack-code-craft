# Observability — full requirements

*Read this when adding or reviewing a feature's operational visibility: logging, telemetry,
domain events, or audit trails. The parent SKILL.md's headline is "required observability" —
this is the full checklist behind that headline.*

Every feature carries explicit operational-visibility expectations.

- **Logs** — structured, with stable event names and key-value fields.
- **Correlation** — correlation and causation IDs in logs and traces, for end-to-end flow
  tracking.
- **Telemetry** — latency, throughput, error rate, saturation on critical paths.
- **Domain events** — required for meaningful business state changes. Explicit, in ubiquitous
  language, versioned when contracts evolve. Keep operational telemetry separate from
  business domain events.
- **Audit trails** — mandatory for security-sensitive or compliance-relevant actions. Capture
  actor, action, target, timestamp, outcome. Append-only and tamper-evident by design.
- **Never log** secrets, credentials, tokens, or regulated sensitive payloads.
- Changes to logging, telemetry, domain events, or auditing come with test coverage updates.
