# BazukaSchool navigation contract

Sources: user screenshot and request 2026-11-22; `docs/course-requirements.json`; existing material, course and lesson components. This change reorganizes navigation only. Local data remains on the same origin and uses existing keys. No new permissions, billing, deletion or authentication behavior.

## Canonical UI map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Navigation | app/page.tsx, skill-sections.tsx | Hash destinations; browser Back and reload restore outer destination. Internal lesson section tabs retain existing local state. | skill indexes, resource links | browser navigation |
| Select/Listbox | components/ui/select.tsx | Existing authored select retained in practice; no new dropdowns. | existing theme | popup interaction |
| Form | existing Editor and Quiz | Existing explicit save and feedback; navigation keeps editorDrafts within session. | essay, answer | existing save flow |
| Scrollbar | app/globals.css | DESIGN.md | forced colors | browser screenshot and computed style |
| Toast/status | existing inline status | No new notification system or persistence claims. | existing status | browser inspection |
| CRUD | existing browser storage and recorder | Unchanged; no server or external side effects added. | none | unchanged storage keys |

## Flow ledger
Home → skill → named material → existing learning action. Four skills are equally prominent. Additional sections group course, recordings, vocabulary and sources. The main content receives programmatic focus after a hash transition; sidebar's existing mobile drawer closes after selection. Resource anchors work with keyboard and support copying/opening links. Home and parent skill remain in breadcrumbs.

## Route document title policy
`{page label} — BazukaSchool`; applies after client navigation. No personal data in URLs or titles. Unknown hash destinations return to the home view. Invalid lesson sections use the first section rather than an empty screen.

## Scope and legacy drift
This is a staged navigation change. Old recorder confirmation and legacy form behavior remain outside the changed flow. A full auth/storage rollout is a separate draft branch. No complete mock Listening/Reading advertised. Lesson resource completion comes only from existing completion flags; no invented progress.

## Verification
Build/typecheck; lint the new skill component; inspect home, all four sections, direct lesson and source navigation, reload/Back, existing practice select popup, mobile menu and keyboard focus. Ensure original material JSON/public assets are unchanged in Git. New pages contain no network dependencies beyond existing links.

## Writing Maps presentation
Writing → Task 1: Maps opens an 11-slide, client-side presentation. Numbered buttons and Previous/Next navigate without storage; all lesson material remains readable by scrolling. Original images are preserved.
