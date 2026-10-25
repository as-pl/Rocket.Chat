# AGENTS.md (AS-PL Rocket.Chat fork)

## Paired workspace with AS-PL monorepo

AS-PL customization: chat changes often span this fork and the ERP/Webpage integration in the adjacent monorepo.

- Treat this repository and `../as-pl-monorepo` as a paired workspace for chat tasks, with separate Git histories. A request made in either repository includes necessary integration changes in the other unless the user explicitly limits the scope.
- The canonical ownership, discovery and coordinated commit/push rules are in the monorepo's `rules/10-apps/rocketchat.md`, section `Powiazane repozytoria`. Read that section for cross-repository work and `commit & push`; read the partner's `AGENTS.md` before editing it. Resolve the actual checkout first; the monorepo may select this fork through `ROCKETCHAT_DEV_DIR`.
- `commit & push` includes only agreed task changes in each affected repository. Preserve unrelated work, use separate commits, and push the monorepo before the fork when both changed. Do not switch branches automatically. Ordinary shell `git push` still affects only its own repository.
- A push to `aspl` triggers image publication, including `latest`; a new production pod may pull that image. Report this effect before pushing. A commit/push request does not authorize manual deployment or production data changes, and does not by itself invoke the full release procedure below.

## Fork-specific customizations

- Every code block that is specific to the AS-PL fork must be marked with a nearby comment starting with `AS-PL customization:`.
- The comment must explain why the customization exists, not only what the code does.
- For LiveChat changes that depend on the conversation not being accepted by an agent yet, the comment must explicitly describe that pre-acceptance dependency.
- Preserve these comments during refactors, upstream merges, and version upgrades so maintainers can distinguish AS-PL behavior from upstream Rocket.Chat behavior.
- Apply the same marker to regression tests that protect fork-specific behavior.

## Branches

- `aspl` is the permanent default branch; direct pushes and optional PRs are supported.
- Never force-push or delete `aspl`. Historical tips live in protected `archive/*` tags.
- `origin` is the AS-PL fork; `upstream` is the official RocketChat/Rocket.Chat repository.
- Upgrade from a selected stable upstream tag on `codex/upgrade-rocketchat-<version>`,
  then merge into `aspl` preserving upstream ancestry and AS-PL customizations.
- Daily work and source/image/runtime identification: monorepo `tools/rocketchat/README.md`.

## AS-PL release procedure

AS-PL customization: keep production chat available while retaining separate code and GitOps repositories.
The approved release flow replaces the former manual patch increment in Makefile and GitOps.

1. Inspect Rocket.Chat, as-pl-monorepo and dotfiles/gmon working trees; preserve unrelated changes and stage only task files.
2. Run relevant checks before publishing. Makefile accepts IMAGE_REPOSITORY and IMAGE_TAG for local versioned images; the monorepo workflow publishes latest after checks.
3. The aspl push dispatcher passes the exact fork SHA to rocketchat-build.yml on monorepo webpage-backend, using existing self-hosted builders.
4. Require passing checks, versioned image plus latest publication and metadata with registry digest, workflow/source SHAs and migration fingerprint.
5. GitOps stays on ghcr.io/as-pl/as-pl-monorepo/rocketchat:latest. The workflow owns latest; gmon only restarts the Deployment and verifies the rollout. It never promotes tags or writes to the registry.
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
