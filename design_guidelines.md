# LifeOps Design Guidelines

## Philosophy
LifeOps is a **Cognitive Load Management System** - NOT a productivity app.
The user should feel: **Guided, not managed. Supported, not monitored. Relieved, not pressured.**

## Brand Identity

**Purpose**: LifeOps helps users manage mental capacity through intelligent action selection. It uses a mental-state-first approach to recommend single best actions based on cognitive weight, available time, and energy levels.

**Aesthetic Direction**: Calm, supportive minimalism. This is a mental wellness tool focused on sustainable pacing and cognitive clarity.

**Memorable Element**: The focused, quiet home screen showing only ONE suggested action at a time - sometimes recommending recovery over action.

## Navigation Architecture

**Root Navigation**: Tab Navigation (3 tabs)
- **Focus** (Home) - Single card showing mental state + suggested action
- **Commitments** - Active cognitive commitments
- **Profile** - Settings and Daily Insight access

## Color Palette

- **Primary**: `#5B8A8F` (Muted Teal) - Calm, supportive
- **Success**: `#6B9B7F` (Sage Green) - Completion, relief
- **Warning**: `#C4A77D` (Warm Gold) - Gentle attention
- **Error**: `#B07D7D` (Dusty Rose) - Soft urgency
- **Background Root**: `#F8F9FA` (Light) / `#121212` (Dark)
- **Background Default**: `#FFFFFF` (Light) / `#1E1E1E` (Dark)
- **Text Primary**: `#2C2C2C` / `#F5F5F5`
- **Text Secondary**: `#6B6B6B` / `#A0A0A0`
- **Border**: `#E0E0E0` / `#333333`

## Typography

**Font**: System default (SF Pro for iOS, Roboto for Android)

**Type Scale**:
- **H1**: 28px, Bold
- **H2**: 24px, Semibold
- **H3**: 20px, Semibold
- **H4**: 17px, Semibold
- **Body**: 16px, Regular, line-height 24px
- **Small**: 14px, Regular
- **Caption**: 12px, Regular

Generous spacing throughout. Comfortable line heights (1.5x minimum).

## Language Guidelines

**STRICT - AVOID:**
- "Productivity", "Efficiency", "Maximize"
- "Crush your goals", "Get more done", "Be more productive"
- Streak counters, gamification, badges
- Checklist language

**USE INSTEAD:**
- "Stability", "Focus quality", "Mental clarity"
- "Sustainable pace", "Recovery", "Cognitive weight"
- "Commitments" (not "Tasks")
- "Pressure point" (not "Due date")
- "Cognitive weight" (not "Priority")

## Core UI Principles

### NO Lists on Home Screen
- Home shows ONE card with current mental state + suggested action
- Never show checkboxes
- Never show "Today / Upcoming" sections
- Center-aligned focus card

### Mental State First
- Always acknowledge energy and available time
- Use supportive language
- Adaptive silence: sometimes recommend NO action

**Example copy:**
- "You have moderate mental energy and 22 minutes available."
- "Suggested focus: Revise physics formulas (15 min)"
- "No action recommended right now. Recovery is more valuable."
- "Your mental load is saturated. Pushing further may reduce focus quality."

### Mental Load Budget
- Daily mental capacity meter at top of home screen
- Three states: Available (green), Moderate (gold), Saturated (rose)
- Each commitment consumes mental capacity
- Capacity refills with rest activities

## Screen Specifications

### 1. Onboarding Flow (3 steps)
- Step 1: "How mentally heavy does today feel?" (Very Light → Very Heavy)
- Step 2: "How much time do you realistically have right now?" (5/15/30/60+ min)
- Step 3: "Do you want to push or protect your energy today?" (Push/Protect)
- Full screen, no header, centered content

### 2. Home Screen (Focus)
- Mental capacity meter at top
- Current energy/time description
- Energy level selector (Low/Moderate/High pills)
- Single action card (centered)
- "Recalibrate mental state" link at bottom

### 3. Commitments Screen
- Simple vertical list of active commitments
- Each card shows: category icon, title, cognitive weight badge, time estimate
- No checkboxes - tap to view details
- Empty state: "No commitments yet"

### 4. Add Commitment Screen (Modal)
- Fields: Title (textarea), Category (Mind/Work/Life), Cognitive Weight (Light/Moderate/Heavy), Estimated Time (preset buttons), Pressure Point (optional date picker)
- Submit button: "Add Commitment"

### 5. Focus Session Screen (Modal)
- Large circular timer display
- Commitment title and details
- Pause/Resume button
- Complete button (primary)
- "Defer for later" link

### 6. Daily Insight Screen
- Cognitive load used vs available (percentage)
- Completed count
- Focus pattern (short sessions / balanced / deep focus)
- Peak clarity time (morning/afternoon/evening)
- One supportive insight about mental rhythm
- Healthcare disclaimer

### 7. Recalibrate Screen (Modal)
- Adjust mental heaviness, available time, energy mode
- Preserves current capacity used
- "Update State" button

## Visual Design Rules

- **NO** emojis, gradients, neon colors, purple, pink, or fancy animations
- **NO** productivity jargon, AI hype language, or gamification
- **NO** progress bars, streaks, badges
- Buttons: Solid, neutral, with subtle press states
- Cards: Clean with minimal shadow
- Icons: Feather icons only
- Language: Calm, respectful, supportive, non-guilt-inducing

## Healthcare Alignment

Every screen should reinforce that LifeOps is:
- Preventive mental healthcare
- Burnout avoidance system
- Cognitive hygiene tool

Include disclaimer: "LifeOps supports mental well-being but does not replace professional care."

## Assets

1. **icon.png** - App icon featuring minimal geometric symbol representing mental clarity
2. **splash-icon.png** - Launch screen icon (same as app icon)
3. **empty-tasks.png** - Illustration for empty commitments list
4. **daily-replay-empty.png** - Illustration for no completed items
5. **avatar-default.png** - Default user avatar
