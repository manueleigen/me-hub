---
title: Design System Toolkit — Konzept
type: konzept
tags: [design-system, open-source, tooling]
date: 2025-03-15
---

# Design System Toolkit

Idee für ein Open-Source Toolkit, das den Aufbau von Design Systems beschleunigt.

## Problem

Jedes Design-System-Projekt fängt bei Null an:
- Gleiche Token-Strukturen werden immer wieder neu erfunden
- Figma ↔ Code Sync ist fragil und wartungsintensiv  
- Dokumentation hinkt hinter der Implementierung her

## Lösung

Ein Opinionated Starter-Kit:

```
design-system-toolkit/
  tokens/          # W3C Token Format Basis-Set
  figma/           # Figma-Vorlage (Variables + Components)
  packages/
    ui/            # React Komponenten (Tailwind)
    docs/          # Storybook Config + MDX Templates
    tokens-sync/   # Figma Variables → Code Sync
  scripts/         # CI/CD für Chromatic, Token-Diff
```

## Differenzierung vs. Radix / shadcn

- **Radix/shadcn**: Unstyled oder opinionated UI, kein echtes Token-System
- **Dieses Toolkit**: Token-First, Figma-First, mit Sync-Workflow

## Nächste Schritte

1. Token-Basis definieren (angelehnt an Aurora)
2. Figma-Vorlage bauen
3. `tokens-sync` CLI als erster Release
4. GitHub + npm veröffentlichen

## Zeitplan (rough)

- **Mai–Jun 2025**: Token Spec + CLI
- **Jul–Aug 2025**: React UI Package
- **Sep 2025**: Public Beta
