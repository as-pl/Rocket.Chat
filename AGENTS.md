# AGENTS.md (AS-PL Rocket.Chat fork)

## Fork-specific customizations

- Every code block that is specific to the AS-PL fork must be marked with a nearby comment starting with `AS-PL customization:`.
- The comment must explain why the customization exists, not only what the code does.
- For LiveChat changes that depend on the conversation not being accepted by an agent yet, the comment must explicitly describe that pre-acceptance dependency.
- Preserve these comments during refactors, upstream merges, and version upgrades so maintainers can distinguish AS-PL behavior from upstream Rocket.Chat behavior.
- Apply the same marker to regression tests that protect fork-specific behavior.

## Full Rocket.Chat update procedure

The Polish commands `przeprowadź pełną aktualizację` and `przeprowadz pelna aktualizacje`, when used in the Rocket.Chat context, authorize and require the complete release procedure below. Do not stop after committing code or changing the infrastructure tag.

1. Inspect both repositories before changing files:
   - Rocket.Chat: `/home/artur/projects/Rocket.Chat`, normally branch `as8.5.1`.
   - GitOps: `/home/artur/projects/as-pl-monorepo`, normally branch `webpage-backend`.
   - Preserve unrelated working-tree changes and stage only files belonging to the current Rocket.Chat task.
2. Read the current custom image tag from both `Makefile` and `infrastructure/gitops/environments/production/rocketchat.values.yaml`. Increment the patch component by one and require both repositories to end with the same tag.
3. Before committing, run the narrowest relevant lint, typecheck, and regression tests for the current changes. Stop on a new error; do not publish a known-broken image.
4. Update both `docker-build` and `docker-push` entries in the Rocket.Chat `Makefile` to the new `arturkmera/custom-rc:<version>` tag.
5. Commit only the task-scoped Rocket.Chat changes plus `Makefile`, verify the staged diff, and push the current Rocket.Chat branch to `origin`.
6. From the Rocket.Chat repository, with Node.js `22.22.3` on `PATH`, run `make rebuild-publish`. This must complete package build, Meteor build, Docker build, and Docker push.
7. Treat the Docker registry digest printed by `docker push` as the publication success gate. If build or push fails, stop and do not change GitOps.
8. After a successful image push, update only `infrastructure/gitops/environments/production/rocketchat.values.yaml` in the AS-PL monorepo to the published tag. Do not stage unrelated monorepo changes.
9. Verify the staged GitOps diff, commit it separately with `chore(infra): bump Rocket.Chat image to <version>`, and push `webpage-backend` to `origin`.
10. Finish by checking that both local HEADs match their corresponding `origin` branches, `docker buildx imagetools inspect arturkmera/custom-rc:<version>` returns the published digest, and the Rocket.Chat/GitOps files in scope are clean.

This procedure publishes code and updates the desired GitOps image only. It does not authorize an ArgoCD sync, Kubernetes rollout, pod restart, database change, or production smoke test unless the user asks for those actions separately.
