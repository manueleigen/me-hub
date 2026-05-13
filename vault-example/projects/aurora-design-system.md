---
title: Aurora Design System
status: active
client: vertex-finance-ag
clientName: Vertex Finance AG
tags: [design-system, ui, figma, tokens, react]
date: 2025-02-10
---

# Aurora Design System

Aufbau eines unternehmensweiten Design Systems für Vertex Finance AG — von den Foundations bis zur vollständig dokumentierten React-Komponentenbibliothek.

## Überblick

Aurora ist ein modulares Design System, das Konsistenz über alle Produkte von Vertex hinweg sicherstellt. Es umfasst Design Tokens, eine Figma-Komponentenbibliothek und eine React-Implementierung (TypeScript + Tailwind).

## Scope

- **Foundations**: Farben, Typografie, Spacing, Schatten, Radius
- **Komponenten**: ~60 Atoms und Molecules (Buttons, Inputs, Cards, Modals, Tables, …)
- **Patterns**: Formularlayouts, Datentabellen, Onboarding-Flows
- **Dokumentation**: Storybook + Figma-Annotations

## Tech Stack

- Figma (Components + Variables)
- React 18 + TypeScript
- Tailwind CSS + CSS Custom Properties als Token-Layer
- Storybook 8
- Chromatic für Visual-Regression-Tests

## Status

| Milestone | Fortschritt |
|-----------|------------|
| Foundations definiert | ✅ Abgeschlossen |
| Figma Component Library | ✅ Abgeschlossen |
| React: Atoms | ✅ Abgeschlossen |
| React: Molecules | ✅ Abgeschlossen |
| Storybook Docs | 🔄 In Arbeit (75%) |
| Patterns | 📅 Geplant Q3 2026 |

## Notizen

- Token-Struktur orientiert sich an W3C Design Tokens Format
- Dark Mode von Anfang an mitgedacht (semantic tokens)
- Übergabe an internes Dev-Team geplant für August 2026
