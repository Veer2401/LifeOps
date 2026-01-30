# LifeOps Design Guidelines

## Brand Identity

**Purpose**: LifeOps is a decision-centric productivity app that reduces mental load by determining the single best next action based on available time, energy, and priority.

**Aesthetic Direction**: Professional minimalism - calm, trustworthy, and human-crafted. This app must feel like something a serious professional or student would trust and pay for monthly.

**Memorable Element**: The focused, quiet home screen showing only ONE task at a time - a radical departure from overwhelming to-do lists.

## Navigation Architecture

**Root Navigation**: Tab Navigation (3 tabs)
- **Home** (Next Best Action) - Center tab, primary focus
- **Tasks** - Task list and creation
- **Profile** - Settings and Daily Replay access

## Screen-by-Screen Specifications

### 1. Authentication Screens (Stack-Only Flow)
- **Signup Screen**: Email + password fields, submit button, link to login
- **Login Screen**: Email + password fields, submit button, link to signup
- Header: None (full screen forms)
- Layout: Centered form with generous vertical spacing
- Submit buttons: Below form inputs

### 2. Home Screen (Next Best Action)
- Purpose: Display the single best task to focus on right now
- Header: Transparent, title "Next Best Action"
- Layout: 
  - Scrollable root view with top inset: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
  - Centered card showing selected task with title, category, estimated time, priority
  - "How much time do you have?" selector (5/15/30/60+ min buttons)
  - "Energy level?" selector (Low/Medium/High buttons)
  - Primary action button: "Start Focus Session"
- Empty state: Illustration with message "No tasks scheduled. Add your first task to get started."

### 3. Focus Session Screen (Modal)
- Purpose: Timer interface for active focus session
- Header: Transparent with close button (X) on left
- Layout:
  - Scrollable root view
  - Large timer display (centered)
  - Task title and details
  - Action buttons (stacked): Pause, Complete, Reschedule
- No floating elements

### 4. Tasks Screen
- Purpose: View all tasks, create new tasks
- Header: Default with title "Tasks", right button: "+" (add task)
- Layout:
  - List view with top inset: Spacing.xl, bottom: tabBarHeight + Spacing.xl
  - Task cards grouped by category (Study/Work/Personal)
  - Each card shows: title, time estimate, priority indicator, deadline if set
- Empty state: Illustration with message "Ready to organize your life. Create your first task."

### 5. Add/Edit Task Screen (Modal)
- Purpose: Create or modify task
- Header: Default, title "New Task" or "Edit Task", left: Cancel, right: Save
- Layout:
  - Scrollable form with top inset: Spacing.xl, bottom: insets.bottom + Spacing.xl
  - Fields: Title (text input), Category (segmented control: Study/Work/Personal), Estimated time (number picker in minutes), Priority (segmented control: Low/Medium/High), Deadline (optional date picker)
- Form buttons: In header (Cancel/Save)

### 6. Profile Screen
- Purpose: User settings and Daily Replay access
- Header: Default with title "Profile"
- Layout:
  - Scrollable root view with top inset: Spacing.xl, bottom: tabBarHeight + Spacing.xl
  - User avatar and display name
  - Navigation list items: Daily Replay, Notification Settings, Account Settings
  - Logout button at bottom
- Account Settings includes nested Delete Account option (double confirmation required)

### 7. Daily Replay Screen
- Purpose: End-of-day summary and reflection
- Header: Default with title "Daily Replay", left: Back button
- Layout:
  - Scrollable root view
  - Sections: Completed tasks list, Time spent summary, Tasks postponed/missed, AI-generated reflection (1-2 calm sentences)
- Empty state: "Complete your first task to see your daily progress."

## Color Palette

- **Background**: #F5F5F5 (off-white/light gray)
- **Surface**: #FFFFFF (cards, elevated elements)
- **Primary**: #5B8A8F (muted blue-green)
- **Text Primary**: #2C2C2C (charcoal)
- **Text Secondary**: #6B6B6B (medium gray)
- **Border**: #E0E0E0 (subtle dividers)
- **Success**: #6B9B7F (muted green)
- **Warning**: #C4A77D (muted gold)
- **Error**: #B07D7D (muted red)

## Typography

**Font**: System default (SF Pro for iOS, Roboto for Android) or Inter if custom font needed

**Type Scale**:
- **Title**: 28px, Bold
- **Headline**: 22px, Semibold
- **Body**: 16px, Regular, line-height 24px
- **Caption**: 14px, Regular
- **Button**: 16px, Semibold

Generous spacing throughout. Comfortable line heights (1.5x minimum).

## Visual Design Rules

- **NO** emojis, gradients, neon colors, purple, pink, or fancy animations
- **NO** productivity jargon, AI hype language, or gamification
- Buttons: Solid, neutral, with subtle press states
- Cards: Clean white with minimal shadow (shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, shadowRadius: 2)
- Icons: System icons or Feather icons only
- Language: Calm, respectful, supportive, non-guilt-inducing

## Assets to Generate

1. **icon.png** - App icon featuring minimal geometric symbol representing focus/clarity (muted blue-green palette)
2. **splash-icon.png** - Launch screen icon (same as app icon)
3. **empty-tasks.png** - Illustration for empty task list: simple line art of organized desk/planner (WHERE USED: Tasks screen empty state)
4. **empty-home.png** - Illustration for no available tasks: simple line art of calm workspace (WHERE USED: Home screen empty state)
5. **daily-replay-empty.png** - Illustration for no completed tasks: simple line art of sunrise/new day (WHERE USED: Daily Replay empty state)
6. **avatar-default.png** - Default user avatar: minimal circular geometric pattern (WHERE USED: Profile screen)

All illustrations must be simple, tasteful line art in muted colors matching the palette. Professional and calm aesthetic.