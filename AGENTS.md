# AGENTS.md (AS-PL Rocket.Chat fork)

## Fork-specific customizations

- Every code block that is specific to the AS-PL fork must be marked with a nearby comment starting with `AS-PL customization:`.
- The comment must explain why the customization exists, not only what the code does.
- For LiveChat changes that depend on the conversation not being accepted by an agent yet, the comment must explicitly describe that pre-acceptance dependency.
- Preserve these comments during refactors, upstream merges, and version upgrades so maintainers can distinguish AS-PL behavior from upstream Rocket.Chat behavior.
- Apply the same marker to regression tests that protect fork-specific behavior.
