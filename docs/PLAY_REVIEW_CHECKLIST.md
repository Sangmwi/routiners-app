# Play Review Checklist

Last updated: 2026-02-27

## A. Native Value

- [ ] Native tab navigation is enabled in app shell.
- [ ] Native settings screen is reachable from profile header while running in WebView app mode.
- [ ] Android back behavior is consistent:
  - [ ] tab detail -> goBack
  - [ ] tab root (except home) -> home
  - [ ] home -> double back to exit
- [ ] Native features are actively used (session handling, login, image picker).

## B. Account / Data Deletion

- [ ] In-app account deletion path exists (native settings -> withdraw).
- [ ] Deletion uses authenticated API (`DELETE /api/user/withdraw`).
- [ ] Logout/session clear after deletion is verified.
- [ ] Play Console/Data Safety includes matching deletion flow description.

## C. Technical Quality

- [ ] `routiners-web`: `npm run build` passes.
- [ ] `routiners-app`: `npx tsc --noEmit` passes.
- [ ] `routiners-shared-contracts`: `npm run test` passes.
- [ ] No critical ANR/crash regressions in internal test track.
- [ ] Login/logout/withdraw and callback flow have no blank or dead-end screens.

## D. Policy / Store Metadata

- [ ] Data safety form is up to date.
- [ ] Account deletion description matches in-app behavior.
- [ ] Sensitive permissions have explicit product justification.
- [ ] Store screenshots and app description reflect current app behavior.

## E. Release Gate

- [ ] Internal QA checklist passed.
- [ ] Pre-launch report triage complete.
- [ ] Staged rollout plan defined (alpha -> closed test -> production).
