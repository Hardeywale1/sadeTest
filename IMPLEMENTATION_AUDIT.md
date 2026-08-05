# Sadé frontend/backend alignment audit

This audit compares `sade/SADE BACKEND.pdf`, the Go routes in `sade/internal`, and the current Expo frontend.

## Implemented or aligned in this pass

- Onboarding is now a required post-auth journey driven by `GET /v1/onboarding/questionnaire`.
- The first-run flow now follows three separate backend modules: questionnaire save, interest-catalog selection, then preset-goal assignment.
- Questionnaire answers resume through `GET/PUT /v1/me/onboarding`; the editable care journey remains under Profile without being confused with the first-run gate.
- Interest choices sync with `/v1/me/interests`; preset goals are assigned through `/v1/me/goals/assign`, have a Profile management screen, and appear on Home.
- Cycle history initializes `/v1/me/cycle/settings` so phase estimates use the user's dates and averages.
- Frontend cycle contracts now match the backend (`cycle_day`, `subtitle`, `phase_label`, `periods`, `entries`, and `medications`).
- Period logging includes start date and flow; OPK and basal temperature are saved to their respective backend records.
- Editable dates use the shared calendar control instead of free-text date fields.
- Quick actions navigate to the correct period, mood/daily-log, and journal destinations.
- Tracking now has daily logging, category history, a seven-entry progress chart, symptom/pain/medication counts, period history, and ovulation history.
- Journal creation reports backend errors and is limited to 20 entries per user per calendar month in both the service and UI.
- Community post creation uses the interest catalog, supports anonymous posting, and reports backend errors. Firestore list queries no longer silently depend on composite ordering indexes.
- Menstrual, follicular, estimated ovulation, and luteal boundaries use the configured cycle and period lengths. An overdue cycle does not invent an unlogged period.
- Bottom navigation and the account action now use Material icons while preserving the existing colors and serif typography.

## Important remaining PDF gaps

### MVP-facing gaps

- Detailed cycle symptom forms: history is visible and BBT is saved, but dedicated PMS, discharge, ailment, pain, and medication composers can still be expanded.
- Personalized feed: Home shows care-focus goals and cycle guidance, but does not yet assemble resources, insights, and notifications by selected interest.
- Library/education: no production frontend experience is connected.
- Notifications: no notification center or preferences experience is connected in this frontend.
- Community: posts and clans exist; replies, reactions, reports, and moderation remain incomplete.
- Privacy: consent, data export, account deletion, and notification preference flows are not complete.

### Explicitly deferred product areas

- AI conversation and the advanced insight engine.
- Telemedicine/practitioner booking and secure messaging.
- E-commerce catalog, cart, checkout, payments, and orders.
- Admin dashboard workflows.

## Health calculation note

Cycle phases are estimates based on the last logged period and the user's average lengths. OPK/BBT records add context but are not diagnoses or guarantees of ovulation. The UI should continue to use educational language and encourage clinical care for unusual pain, bleeding, or missed periods.
