# AGENTS.md (AS-PL Rocket.Chat fork)

## Fork-specific customizations

- Every code block that is specific to the AS-PL fork must be marked with a nearby comment starting with `AS-PL customization:`.
- The comment must explain why the customization exists, not only what the code does.
- For LiveChat changes that depend on the conversation not being accepted by an agent yet, the comment must explicitly describe that pre-acceptance dependency.
- Preserve these comments during refactors, upstream merges, and version upgrades so maintainers can distinguish AS-PL behavior from upstream Rocket.Chat behavior.
- Apply the same marker to regression tests that protect fork-specific behavior.

## AS-PL release procedure

AS-PL customization: keep production chat available while retaining separate code and GitOps repositories.
The approved release flow replaces the former manual patch increment in Makefile and GitOps.

1. Inspect Rocket.Chat, as-pl-monorepo and dotfiles/gmon working trees; preserve unrelated changes and stage only task files.
2. Run relevant checks before publishing. Makefile accepts IMAGE_REPOSITORY and IMAGE_TAG; never push latest from the build.
3. The as8.5.1 push dispatcher passes the exact fork SHA to rocketchat-build.yml on monorepo webpage-backend, using existing self-hosted builders.
4. Require passing checks, immutable candidate publication and metadata with registry digest, workflow/source SHAs and migration fingerprint.
5. GitOps stays on arturkmera/custom-rc:latest. Only gmon may promote a candidate under the deployment-host lock and perform a controlled rollout.
6. AUTO stays OFF/blocked until scalability, shared storage, continuity and rollback evidence are verified. The user explicitly requires this gate. Never bypass it.
7. Deployment succeeds only after stable readiness, matching runtime digest and health verification. Uncertain/failed operations stay blocked across restarts; reconcile explicitly. No automatic retry or rollback.
8. Upstream-version or migration changes require a supervised compatibility/backup/upgrade procedure; do not treat image rollback as database rollback.
9. Preserve AS-PL customization comments in the workflows, chart, release tooling and regression tests.

The Polish commands `przeprowadź pełną aktualizację` and `przeprowadz pelna aktualizacje`
authorize this complete flow through verified deployment only when its P0/AUTO gates are satisfied.
Otherwise finish candidate publication and report the precise activation blocker without bypassing it.
Configuration synchronization through Argo CD, database changes and production smoke tests require
their explicit task scope; ordinary gmon releases do not run Argo sync or its Jitsi PostSync hook.

The operational checklist and bootstrap are in the separate monorepo: `tools/rocketchat/README.md`.
