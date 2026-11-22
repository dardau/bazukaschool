---
version: alpha
name: BazukaSchool
description: IELTS learning workspace
colors:
  background: '#fff8f4'
  primary: '#7355d9'
  foreground: '#302b3d'
  listening: '#6445bd'
  reading: '#086d52'
  writing: '#a4450b'
  speaking: '#ac294c'
typography:
  body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  heading:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
rounded:
  card: '24px'
  resource: '18px'
spacing:
  skill-grid-gap: '20px'
components:
  skill-card:
    height: '244px'
  listening-card:
    backgroundColor: '{colors.listening}'
  reading-card:
    backgroundColor: '{colors.reading}'
  writing-card:
    backgroundColor: '{colors.writing}'
  speaking-card:
    backgroundColor: '{colors.speaking}'
  resource-link:
    textColor: '{colors.foreground}'
    padding: '24px'
---
# BazukaSchool design system

## Overview
Russian-speaking IELTS students and their teacher need a recognizable entry point for each skill. The reference supplied on 22 November 2026 shows four large colored cards: purple Listening, green Reading, orange Writing, rose Speaking. This navigation, rather than decorative photography, is the signature. Preserve the friendly existing course and all original material. No Japan-market scope.

Product register: a learning tool, not a marketing landing page. Use English IELTS skill names with short Russian explanations. Avoid an exam catalogue promising tests that do not exist.

## Colors
Runtime source: `app/globals.css` :root. This document mirrors the established background/primary/foreground and new `--skill-listening`, `--skill-reading`, `--skill-writing`, `--skill-speaking`. The shared `skill-*` classes assign `--skill-color` and `--skill-soft` to both dashboard cards and section pages. Darker saturated colors preserve white-text contrast. Color never stands alone: every card has a name, description, and icon.

## Typography
Retain existing font stack across Cyrillic and English. Skill titles use a bold 38px treatment, body 14–16px, utility metadata 11–12px. No external font dependency or late font swapping. Hierarchy comes from size and weight, not a new font for each section.

## Layout
Desktop: four equal cards in a two-column grid; mobile below 600px: a vertical list. Sections show introduction, three-step practice guidance, and resource links. Course and vocabulary remain available independently. The sidebar groups navigation into skills, lessons and tools. Document scrolling owns page height; no fixed-height clipping of content.

## Elevation & Depth
Keep ordinary resources flat with a fine border. Only hover on dashboard cards adds shallow elevation and a 3px rise. Reduced motion disables transforms and transitions.

## Shapes
Dashboard radius maps to `--skill-card-radius`; resources use 18px. Round arrows indicate navigation. Lucide illustrations are decorative and hidden from assistive technology; descriptions carry meaning.

## Components
`components/skill-navigation/skill-sections.tsx` owns home cards and all four section indexes. `app/page.tsx` owns hash navigation and breadcrumbs. Existing Sidebar/Select/Tabs primitives remain canonical. Existing course, editor, quiz and recorder remain the owners of learning actions.

## Do's and Don'ts
- Link directly to the relevant lesson section instead of making students rediscover it.
- Keep exact existing storage keys, questions and file paths.
- Label actual available resources; do not present the current short passage/audio as full exam mocks.
- Use native links for resource destinations, visible keyboard focus and clear hover.
- Keep account/backend changes in their existing separate branch.
