# AS-PL Livechat Design QA

## Evidence

- Source visual truth: `/tmp/codex-clipboard-b4ffd9bd-0b0d-4177-ad67-3086d7032641.png`
- Browser-rendered implementation: `/home/artur/projects/Rocket.Chat/implementation-aspl-chat-final.png`
- Side-by-side comparison: `/home/artur/projects/Rocket.Chat/design-comparison-aspl.png`
- Mobile implementation: `/home/artur/projects/Rocket.Chat/implementation-aspl-mobile.png`
- Desktop viewport and CSS size: `1064 × 1219`
- Source pixels: `1064 × 1219`, 96 DPI
- Implementation pixels: `1064 × 1219`, device scale factor 1
- Mobile viewport and CSS size: `390 × 844`
- State: active Polish conversation with one visitor message

## Findings

- No actionable P0, P1, or P2 visual differences remain in the shared widget shell.
- Typography uses Arial/Helvetica at the same compact scale and weight hierarchy as the reference.
- The panel, header, message area, and fixed composer follow the reference spacing and vertical rhythm. The desktop panel is right-aligned and capped at 960 px as specified.
- Colors match the AS-PL direction: dark navy header, AS-PL red accent, white content surface, muted metadata, and pale technical input background.
- The AS brand mark and controls use existing UI/icon components; no placeholder imagery is used.
- Copy matches the selected Polish AS-PL direction. The session/encryption strip is intentionally omitted.
- The source contains additional agent messages and a product card that were not present in the active local backend conversation. Their existing Rocket.Chat message/UI Kit renderers received the same AS-PL styling, but this content difference remains outside the captured visual evidence.

## Focused comparison

- Header: brand tile, title, team/status line, menu, expand, and close controls were compared at equal viewport size.
- Composer: fixed-bottom placement, pale input surface, attachment action, red send action, and `0 / 2000` counter were compared at equal viewport size.
- A separate crop was unnecessary because both focused regions remain clearly legible in the full-resolution side-by-side comparison.

## Comparison history

1. Initial desktop capture used the stale production widget loader and rendered the legacy 365 px width.
2. The local demo was rebuilt and recaptured; the panel then rendered at the required 960 px visible width.
3. The composer was updated to keep the send action visible and to show the 2000-character counter.
4. Mobile capture exposed viewport scrollbars and a 15 px offset. Fullscreen document locking and explicit positioning were added; the final mobile panel measures `390 × 844` at `0,0`.

## Browser checks

- Message submission created and displayed the visitor message.
- Minimize and restore preserved the active conversation.
- Desktop and mobile layouts rendered without application console errors introduced by this change.

final result: passed
