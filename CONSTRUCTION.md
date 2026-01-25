# STASH AI - PROJECT ARCHITECTURE (v1.0)

## 🎯 CORE MISSION
- Create a minimalist, student-focused financial co-pilot.
- Solve "Financial Anxiety" via the "Safe-to-Spend" daily gauge.
- Versioning: Current build is v1.0. Future expansions will be v2+.

## 🏗️ UPDATED TECH STACK (v1.0 - Mobile)
- **Framework:** Expo (React Native) + Expo Router.
- **Styling:** NativeWind (Tailwind CSS for Native).
- **Icons:** @expo/vector-icons (Lucide or Ionicons).
- **Backend/Auth:** Supabase (using the @supabase/supabase-js library).
- **Environment:** Physical testing via Expo Go.

## 🎨 DESIGN SYSTEM INVARIANTS
- **Background:** Pure Black (#000000).
- **Card Surfaces:** Dark Charcoal (#121212) with subtle 1px border (#18181B).
- **Primary Accent:** Emerald Green (#10B981) - Used for "Growth", "Safety", and "Confirm".
- **Typography:** Bold White Inter for headings; Light Gray (#A1A1AA) for descriptions.
- **Icons:** Lucide-React (Stroke: 1.5). No filled icons.

## 🧬 CORE FEATURES & LOGIC
1. **Safe-to-Spend:** (User Balance - Locked Pot Total) / Days Left in Month.
2. **Locked Pots:** Dedicated balance buckets that "subtract" from Available spending.
3. **Split Bill:** Equal division logic for recent transactions (v1).
4. **Navigation:** Fixed Bottom Nav (Dashboard, Spending, Chat, Profile).

## 🗄️ DATABASE SCHEMA (Supabase v1.0)
- `profiles`: { id, full_name, avatar_url, daily_budget_goal }
- `transactions`: { id, user_id, amount, merchant, category, date, type }
- `pots`: { id, user_id, name, amount_locked, icon }
- `goals`: { id, user_id, name, target_amount, current_amount, emoji }

## 🚫 AI HALLUCINATION PREVENTION (STRICT RULES)
- **DO NOT** use 'Red' for alerts. Use Slate Gray (#3F3F46) or Deep Rose for negative states.
- **DO NOT** use 'Native UI' alerts. Always build custom minimalist modals/toasts.
- **DO NOT** suggest adding 'Investment' or 'Stock' features; strictly budgeting for v1.
- **ALWAYS** check `CONSTRUCTION.md` before generating new components to ensure color and spacing consistency (16px/24px grid).
