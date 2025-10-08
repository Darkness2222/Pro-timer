# SyncCue User Roles Guide

**Version:** 1.0
**Last Updated:** January 2025
**Purpose:** Complete guide to understanding and managing user roles in SyncCue

---

## Table of Contents

1. [Introduction](#introduction)
2. [Role Hierarchy Overview](#role-hierarchy-overview)
3. [Quick Reference: Role Comparison](#quick-reference-role-comparison)
4. [Owner Role](#owner-role)
5. [Admin Role](#admin-role)
6. [Presenter Role](#presenter-role)
7. [Permission Matrix](#permission-matrix)
8. [User Limits and Subscriptions](#user-limits-and-subscriptions)
9. [Managing Team Members](#managing-team-members)
10. [Inviting New Team Members](#inviting-new-team-members)
11. [Changing User Roles](#changing-user-roles)
12. [Event Access and Security](#event-access-and-security)
13. [Common Team Structures](#common-team-structures)
14. [Best Practices](#best-practices)
15. [Troubleshooting](#troubleshooting)
16. [FAQ](#faq)
17. [Quick Reference Card](#quick-reference-card)

---

## Introduction

SyncCue uses a three-tier role system to provide the right level of access to each team member. This system ensures that:

- **Security** - Users only have access to features they need
- **Organization** - Clear separation between management and presentation duties
- **Flexibility** - Teams can scale efficiently with proper access control
- **Simplicity** - Easy to understand who can do what

Each user in your organization has exactly **one role** at a time:

1. **Owner** - The organization creator with full control
2. **Admin** - Team managers who handle events and members
3. **Presenter** - Team members who deliver presentations

**Important:** Roles are mutually exclusive. A user cannot be both an Admin and a Presenter at the same time.

---

## Role Hierarchy Overview

```
┌─────────────────────────────────────────┐
│              OWNER                      │
│   ┌─────────────────────────────┐      │
│   │    Full Organization Control │      │
│   │    • Billing & Subscriptions │      │
│   │    • Team Management         │      │
│   │    • All Admin Capabilities  │      │
│   │    • NOT counted in limit    │      │
│   └─────────────────────────────┘      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│              ADMIN                      │
│   ┌─────────────────────────────┐      │
│   │    Management & Events       │      │
│   │    • Team Management         │      │
│   │    • Create/Edit Events      │      │
│   │    • View Reports            │      │
│   │    • Counted in limit        │      │
│   └─────────────────────────────┘      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│            PRESENTER                    │
│   ┌─────────────────────────────┐      │
│   │    Presentation Delivery     │      │
│   │    • Join Events             │      │
│   │    • Control Personal Timers │      │
│   │    • View Own Sessions       │      │
│   │    • Counted in limit        │      │
│   └─────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### Visual Indicators

Each role has a unique icon and color in the SyncCue interface:

| Role | Icon | Color | Badge |
|------|------|-------|-------|
| **Owner** | 👑 Crown | Yellow/Gold | "Owner" badge |
| **Admin** | 🛡️ Shield | Blue | "Admin" label |
| **Presenter** | 🎤 Microphone | Green | "Presenter" label |

---

## Quick Reference: Role Comparison

| Feature | Owner | Admin | Presenter |
|---------|-------|-------|-----------|
| **Manage Subscription** | ✅ Yes | ❌ No | ❌ No |
| **Access Billing** | ✅ Yes | ❌ No | ❌ No |
| **Invite Team Members** | ✅ Yes | ✅ Yes | ❌ No |
| **Remove Team Members** | ✅ Yes | ✅ Yes | ❌ No |
| **Change User Roles** | ✅ Yes | ✅ Yes | ❌ No |
| **Create Events** | ✅ Yes | ✅ Yes | ❌ No |
| **Edit Events** | ✅ Yes | ✅ Yes | ❌ No |
| **Delete Events** | ✅ Yes | ✅ Yes | ❌ No |
| **View Reports** | ✅ Yes | ✅ Yes | ❌ No |
| **Present in Events** | ❌ No | ❌ No | ✅ Yes |
| **Access Timer Controls** | ❌ No | ❌ No | ✅ Yes |
| **Can Be Removed** | ❌ No | ✅ Yes | ✅ Yes |
| **Role Can Change** | ❌ No | ✅ Yes | ✅ Yes |
| **Counts Toward Limit** | ❌ No | ✅ Yes | ✅ Yes |

---

## Owner Role

### What is an Owner?

The **Owner** is the person who created the organization. This role has complete control over all aspects of the organization, including billing, team management, and all administrative functions.

### How is the Owner Assigned?

- The Owner role is **automatically assigned** when you create your SyncCue organization
- You become the Owner during your first login after signing up
- There is exactly **one Owner** per organization

### Owner Capabilities

#### Full Control
- ✅ **Subscription Management** - Upgrade, downgrade, or cancel subscriptions
- ✅ **Billing Access** - View invoices, update payment methods, manage billing information
- ✅ **Team Management** - Invite, remove, and manage all team members
- ✅ **Role Changes** - Change any user's role between Admin and Presenter
- ✅ **Event Management** - Create, edit, and delete events
- ✅ **Reports & Analytics** - Access all performance reports and analytics
- ✅ **Organization Settings** - Configure organization-wide preferences

#### Special Privileges
- 🔒 **Cannot Be Removed** - The Owner account cannot be deleted by any user
- 🔒 **Cannot Be Demoted** - Owner role cannot be changed or transferred
- 💎 **Doesn't Count in User Limit** - Owner account does not count toward your subscription's user limit

### Owner Restrictions

- ❌ **Cannot Present** - Owners cannot join events as presenters
- ❌ **Cannot Access Timer Controls** - Owner accounts do not have presenter timer access
- ❌ **Cannot Transfer Ownership** - The Owner role cannot be transferred to another user

### Why These Restrictions?

The Owner role is designed for **organization management**, not presentation delivery. This separation ensures:
- Clear accountability for billing and subscription decisions
- Dedicated management focus without conflicting responsibilities
- Protection of the organization's administrative control

### Accessing Owner Features

#### From the Settings Modal:

1. Click the **Settings** icon (gear icon) in the top navigation
2. Your role is displayed in the "Account & Organization" section with a Crown icon (👑)
3. Key Owner features accessible from Settings:
   - **Team Management** - Click "Manage Team" button
   - **SyncCue Pro** - Click "Upgrade to Pro" button for subscription management

#### Team Management Access:

**Screenshot Placeholder:** *Settings Modal showing Owner role badge and Team Management button*

The Team Management modal shows:
- Current subscription plan and user count
- Team member list with role indicators
- "Invite Team Member" button
- Role change dropdowns for each member
- Remove member buttons

**Screenshot Placeholder:** *Team Management modal with user list showing role icons*

---

## Admin Role

### What is an Admin?

**Admins** are team managers who can handle day-to-day operations, create and manage events, and invite new team members. They have elevated privileges but cannot access billing or subscription settings.

### Admin Capabilities

#### Team Management
- ✅ **Invite Team Members** - Send invitations to new Admins or Presenters
- ✅ **View Pending Invitations** - See all outstanding invitations
- ✅ **Remove Team Members** - Remove Admins or Presenters (but not the Owner)
- ✅ **Change User Roles** - Switch users between Admin and Presenter roles

#### Event Management
- ✅ **Create Events** - Set up new events with timers and presenters
- ✅ **Edit Events** - Modify event details, timers, and assignments
- ✅ **Delete Events** - Remove events (with soft delete for 30 days)
- ✅ **Generate QR Codes** - Create presenter access links and QR codes
- ✅ **Monitor Access** - View real-time presenter check-ins and claims

#### Reports & Analytics
- ✅ **View Reports** - Access event performance and analytics
- ✅ **Event Comparisons** - Compare multiple event performances
- ✅ **Presenter Performance** - View individual presenter timing data

### Admin Restrictions

- ❌ **No Subscription Management** - Cannot upgrade, downgrade, or cancel plans
- ❌ **No Billing Access** - Cannot view invoices or update payment methods
- ❌ **Cannot Present** - Admin accounts cannot join events as presenters
- ❌ **Cannot Access Timer Controls** - No access to presenter timer interface
- ❌ **Cannot Remove Owner** - Cannot remove the organization Owner

### User Limit Impact

⚠️ **Admins COUNT toward your subscription user limit**

If your plan allows 5 users:
- 1 Owner (not counted) + 3 Admins + 2 Presenters = **5 counted users**
- You've used 5 of your 5 available slots

### Accessing Admin Features

#### From the Main Dashboard:

1. **Events Tab** - Create and manage events
2. **Reports Tab** - View analytics and performance data
3. **Settings → Team Management** - Manage team members

#### Visual Indicators:

Admins are identified by:
- 🛡️ **Blue Shield Icon** next to their name
- **"Admin"** label in team member lists
- Blue color theme in role-related UI elements

**Screenshot Placeholder:** *Team Management modal showing Admin user with Shield icon*

---

## Presenter Role

### What is a Presenter?

**Presenters** are team members who deliver presentations during events. This is the basic user type focused solely on presentation delivery, with no access to administrative features.

### Presenter Capabilities

#### Event Participation
- ✅ **Join Events** - Access events via QR code or direct link
- ✅ **Claim Presenter Slots** - Select and claim assigned presenter positions
- ✅ **PIN Authentication** - Use PIN for secure event access (when configured)
- ✅ **Control Personal Timers** - Start, pause, and manage assigned timers
- ✅ **View Session Info** - See event details and assigned speaking slots

#### Timer Controls
- ✅ **Start Timer** - Begin countdown for assigned presentation
- ✅ **Pause/Resume** - Control timer during presentation
- ✅ **View Progress** - See time remaining and visual warnings
- ✅ **Complete Timer** - Mark presentation as complete
- ✅ **See Stage Cues** - View presenter notes and cues (Pro feature)

### Presenter Restrictions

- ❌ **No Team Management** - Cannot invite or remove team members
- ❌ **No Event Creation** - Cannot create or edit events
- ❌ **No Event Editing** - Cannot modify event details or settings
- ❌ **No Event Deletion** - Cannot remove events from the organization
- ❌ **No Reports Access** - Cannot view analytics or performance reports
- ❌ **No Billing Access** - Cannot view or manage subscription
- ❌ **No Organization Settings** - Cannot change organization-wide preferences

### User Limit Impact

⚠️ **Presenters COUNT toward your subscription user limit**

If your plan allows 5 users:
- 1 Owner (not counted) + 1 Admin + 4 Presenters = **5 counted users**
- You've used 5 of your 5 available slots

### Accessing Presenter Features

#### Joining an Event:

1. **Scan QR Code** - Use your phone to scan the event QR code
2. **Select Your Name** - Choose your presenter slot from the list
3. **Enter PIN** (if required) - Authenticate using your personal PIN
4. **Access Timer** - Automatically redirected to your timer control interface

**Screenshot Placeholder:** *Presenter join page with name selection and PIN entry*

#### PIN Security System:

Presenters can have an optional security PIN that adds an extra layer of protection:

- **PIN Setup** - Admins can configure PINs for each presenter in Team Management
- **PIN Entry** - Presenters enter PIN when joining events (if required)
- **Security Levels**:
  - **No PIN** - Open access, no PIN needed
  - **PIN Optional** - PIN can be entered for verification (recommended)
  - **PIN Required** - Must enter valid PIN to access event
- **Lockout Protection** - After 5 failed attempts, account locks for 30 minutes
- **PIN Expiration** - PINs can be set to expire after a period

**Screenshot Placeholder:** *Presenter PIN entry screen with security indicator*

#### Visual Indicators:

Presenters are identified by:
- 🎤 **Green Microphone Icon** next to their name
- **"Presenter"** label in team member lists
- Green color theme in role-related UI elements
- 🛡️ **Shield badge** if PIN is configured for security

**Screenshot Placeholder:** *Team member list showing Presenter with Microphone icon and PIN indicator*

---

## Permission Matrix

### Complete Permissions Breakdown

| Permission | Owner | Admin | Presenter | Notes |
|------------|-------|-------|-----------|-------|
| **Billing & Subscriptions** ||||
| View subscription details | ✅ | ❌ | ❌ | Owner only |
| Upgrade/downgrade plan | ✅ | ❌ | ❌ | Owner only |
| Update payment methods | ✅ | ❌ | ❌ | Owner only |
| Cancel subscription | ✅ | ❌ | ❌ | Owner only |
| View invoices | ✅ | ❌ | ❌ | Owner only |
| **Team Management** ||||
| View team members | ✅ | ✅ | ❌ | Owner & Admin |
| Invite new members | ✅ | ✅ | ❌ | Can invite Admin or Presenter |
| Remove team members | ✅ | ✅ | ❌ | Cannot remove Owner |
| Change user roles | ✅ | ✅ | ❌ | Between Admin ↔ Presenter only |
| View pending invitations | ✅ | ✅ | ❌ | Owner & Admin |
| Cancel invitations | ✅ | ✅ | ❌ | Owner & Admin |
| **Event Management** ||||
| View events list | ✅ | ✅ | ❌ | Owner & Admin |
| Create new events | ✅ | ✅ | ❌ | Owner & Admin |
| Edit event details | ✅ | ✅ | ❌ | Owner & Admin |
| Delete events | ✅ | ✅ | ❌ | Soft delete for 30 days |
| Restore deleted events | ✅ | ✅ | ❌ | Within 30-day window |
| Generate QR codes | ✅ | ✅ | ❌ | For presenter access |
| Configure security settings | ✅ | ✅ | ❌ | PIN requirements |
| View access logs | ✅ | ✅ | ❌ | Who joined when |
| **Presenter Management** ||||
| Add presenters to events | ✅ | ✅ | ❌ | Owner & Admin |
| Assign timers to presenters | ✅ | ✅ | ❌ | Owner & Admin |
| Set presenter PINs | ✅ | ✅ | ❌ | Security feature |
| Reorder presenter sequence | ✅ | ✅ | ❌ | Presentation order |
| **Reports & Analytics** ||||
| View event reports | ✅ | ✅ | ❌ | Owner & Admin |
| Compare events | ✅ | ✅ | ❌ | Event comparison |
| View presenter performance | ✅ | ✅ | ❌ | Timing analytics |
| Export reports | ✅ | ✅ | ❌ | Data export |
| **Presentation Delivery** ||||
| Join events | ❌ | ❌ | ✅ | Presenter only |
| Claim presenter slots | ❌ | ❌ | ✅ | Presenter only |
| Control timers | ❌ | ❌ | ✅ | During events |
| View stage cues | ❌ | ❌ | ✅ | Pro feature |
| See event details | ❌ | ❌ | ✅ | When assigned |
| **Account Status** ||||
| Can be removed | ❌ | ✅ | ✅ | Owner cannot be removed |
| Role can be changed | ❌ | ✅ | ✅ | Owner role is permanent |
| Counts in user limit | ❌ | ✅ | ✅ | Owner excluded from count |

### Key Takeaways

1. **Owner** = Full control over everything except presenting
2. **Admin** = Management and events but not billing or presenting
3. **Presenter** = Presentation delivery only, no admin access

---

## User Limits and Subscriptions

### Understanding User Limits

Your SyncCue subscription plan includes a specific number of **user seats**. Not all users count toward this limit.

#### Who Counts Toward the Limit?

| Role | Counts Toward Limit? | Reason |
|------|---------------------|--------|
| **Owner** | ❌ No | Owner is essential for organization management |
| **Admin** | ✅ Yes | Admins are additional team capacity |
| **Presenter** | ✅ Yes | Presenters are additional team capacity |

### Subscription Plans

#### Trial Plan (Free)
- **User Limit:** 5 counted users (Admin + Presenter)
- **Total Team Size:** 6 people (1 Owner + 5 others)
- **Duration:** Free trial period
- **Best For:** Small teams testing SyncCue

#### Pro - Starter ($29/month)
- **User Limit:** 5 counted users
- **Total Team Size:** 6 people (1 Owner + 5 others)
- **Features:** All Pro features included
- **Best For:** Small professional teams

#### Pro - Growth ($49/month)
- **User Limit:** 10 counted users
- **Total Team Size:** 11 people (1 Owner + 10 others)
- **Features:** All Pro features included
- **Best For:** Growing teams and organizations

#### Pro - Business ($99/month)
- **User Limit:** 20 counted users
- **Total Team Size:** 21 people (1 Owner + 20 others)
- **Features:** All Pro features included
- **Best For:** Larger teams and events

#### Pro - Enterprise ($199/month)
- **User Limit:** Unlimited counted users
- **Total Team Size:** Unlimited
- **Features:** All Pro features included
- **Best For:** Large organizations with many team members

### Example Calculations

#### Example 1: Small Team
- 1 Owner (not counted)
- 2 Admins (counted)
- 3 Presenters (counted)
- **Total Counted:** 5 users
- **Required Plan:** Trial or Pro - Starter (5 users)

#### Example 2: Medium Team
- 1 Owner (not counted)
- 2 Admins (counted)
- 7 Presenters (counted)
- **Total Counted:** 9 users
- **Required Plan:** Pro - Growth (10 users)

#### Example 3: Large Team
- 1 Owner (not counted)
- 3 Admins (counted)
- 25 Presenters (counted)
- **Total Counted:** 28 users
- **Required Plan:** Pro - Enterprise (unlimited)

### What Happens When You Reach Your Limit?

When you try to invite a new user and you're at your limit:

1. **Invitation Blocked** - The system prevents sending the invitation
2. **Upgrade Prompt** - You'll see a message: "Upgrade to add more users"
3. **Current Count Displayed** - Shows: "5 of 5 users" in Team Management
4. **Action Required** - Either upgrade your plan or remove existing users

#### Upgrading Your Plan:

1. Go to **Settings** (click gear icon)
2. Click **"Upgrade to Pro"** in the Account & Organization section
3. Select a plan with higher user capacity
4. Complete payment update
5. New user slots available immediately

### Checking Your Current Usage

#### From Team Management:

**Screenshot Placeholder:** *Team Management showing user count: "5 of 10 users"*

The Team Management modal displays:
- **Current Plan Name** - (e.g., "Pro - Growth")
- **Counted Users** - "5 / 10" or "5 / Unlimited"
- **Total Users** - "6 total (owner not counted)"

The display helps you:
- See how many slots you're using
- Know when you're approaching the limit
- Plan for team growth

### Removing Users to Free Up Slots

If you need to add someone new but you're at your limit:

1. **Open Team Management**
2. **Identify users to remove** - Look for inactive or temporary team members
3. **Click the trash icon** next to their name
4. **Confirm removal** - Permanent action, cannot be undone
5. **Slot freed immediately** - Can now invite new user

⚠️ **Warning:** Removing users deletes their access immediately. They will need a new invitation to rejoin.

---

## Managing Team Members

### Accessing Team Management

#### For Owners and Admins:

1. Click the **Settings** icon (gear icon) in the top navigation bar
2. Scroll to the **"Account & Organization"** section
3. Click the **"Manage Team"** button in the Team Management card
4. The Team Management modal will open

**Screenshot Placeholder:** *Settings modal with "Manage Team" button highlighted*

### Team Management Modal Overview

The Team Management modal shows:

#### Header Section:
- **Current Plan** - Your subscription plan name
- **User Count** - Counted users vs. limit (e.g., "5 / 10")
- **Total Users** - All team members including Owner

#### Invite Button:
- **"Invite Team Member"** - Click to invite new users
- Disabled if you've reached your user limit
- Shows "Upgrade to add more users" when at capacity

#### Pending Invitations Section:
- **Email addresses** of invited users who haven't accepted yet
- **Role** assigned to each invitation (Admin or Presenter)
- **Cancel button** (X) to revoke invitations

**Screenshot Placeholder:** *Pending invitations list with cancel buttons*

#### Team Members Section:
- **Full list** of all organization members
- **Role icons** (Crown, Shield, Microphone) for each user
- **Email addresses** for identification
- **Role dropdowns** for Admins and Presenters (Owner cannot be changed)
- **Remove buttons** (trash icon) for non-Owner users
- **Special badges**:
  - "Owner" badge for the organization owner
  - "Not Counted" badge if user doesn't count toward limit

**Screenshot Placeholder:** *Team members list with role indicators and action buttons*

### Understanding the Team List Display

Each team member entry shows:

```
┌─────────────────────────────────────────────────────────────┐
│  👑  owner@company.com                    [Owner Badge]      │
│      Owner                                                   │
│      Not counted toward subscription limit                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🛡️  admin@company.com          [Admin ▼]    [🗑️]          │
│      Admin                                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🎤  presenter@company.com      [Presenter ▼]  [🗑️]         │
│      Presenter                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Inviting New Team Members

### Step-by-Step: Inviting Users

#### Step 1: Open the Invitation Form

1. Go to **Settings → Team Management**
2. Click **"Invite Team Member"** button
3. The invitation modal appears

**Screenshot Placeholder:** *Invite Team Member modal with form fields*

#### Step 2: Enter User Information

**Email Address Field:**
- Enter the new user's email address
- Must be a valid email format
- Email will receive the invitation link

**Role Selection:**
Choose between two roles:

```
┌────────────────────────────────────────────────────────┐
│  Role: [Admin - Manage events and team     ▼]         │
│                                                        │
│  Options:                                              │
│  • Admin - Manage events and team                      │
│  • Presenter - Present in events only                  │
└────────────────────────────────────────────────────────┘
```

**Role Descriptions:**
- **Admin** - "Admins can create events, manage the team, but cannot present."
- **Presenter** - "Presenters can only present in events and cannot access admin features."

#### Step 3: Review User Limit Notice

At the top of the invitation modal, you'll see:

> **Note:** The organization owner does not count toward your user limit.
> Current usage: 5 of 10 users

This helps you:
- Understand if you have space for the new user
- Know that the Owner doesn't count
- See your current capacity

#### Step 4: Send the Invitation

1. Click **"Send Invitation"** button
2. The system sends an email to the invited user
3. You'll see a success message: "Invitation sent successfully!"
4. The modal closes automatically
5. The invited user appears in the "Pending Invitations" section

### What the Invited User Receives

The invited user gets an email containing:
- **Organization Name** - Which organization invited them
- **Role Assignment** - What role they'll have (Admin or Presenter)
- **Invitation Link** - Secure link to accept and join
- **Expiration Notice** - How long the invitation is valid

### After Sending Invitations

#### Tracking Pending Invitations:

In the Team Management modal, pending invitations show:

```
┌─────────────────────────────────────────────────────┐
│  Pending Invitations                                 │
│                                                      │
│  📧  newadmin@company.com              [X]          │
│      Admin                                           │
│                                                      │
│  📧  newpresenter@company.com          [X]          │
│      Presenter                                       │
└─────────────────────────────────────────────────────┘
```

#### Canceling Invitations:

If you need to cancel an invitation:
1. Find the invitation in the "Pending Invitations" section
2. Click the **X** button next to the email
3. Confirm cancellation
4. The invitation is revoked immediately
5. The invited user's link will no longer work

### Common Invitation Scenarios

#### Scenario 1: Inviting an Admin
**When to use:** You need someone to help manage events and team members

1. Select **"Admin"** role
2. Enter their email
3. Send invitation
4. New Admin can immediately create events and manage team after accepting

#### Scenario 2: Inviting a Presenter
**When to use:** You need someone to deliver presentations in events

1. Select **"Presenter"** role
2. Enter their email
3. Send invitation
4. New Presenter can join events via QR code after accepting

#### Scenario 3: At User Limit
**What happens:** Button shows "Upgrade to add more users"

**Options:**
- Upgrade your subscription plan to add more capacity
- Remove an existing user to free up a slot
- Wait for someone to leave the organization

### Invitation Best Practices

1. **Verify Email Addresses** - Double-check spelling before sending
2. **Choose the Right Role** - Think about what the person needs to do
3. **Track Pending Invitations** - Follow up with users who haven't accepted
4. **Cancel Expired Invitations** - Keep your list clean by removing old invites
5. **Plan for User Limits** - Check capacity before inviting multiple users

---

## Changing User Roles

### When to Change Roles

You might need to change a user's role when:
- Someone's responsibilities have changed
- You need an Admin to focus on presenting
- A Presenter needs to help with event management
- Reorganizing team structure

### Role Change Rules

#### What You CAN Change:
- ✅ Admin → Presenter
- ✅ Presenter → Admin

#### What You CANNOT Change:
- ❌ Owner → Admin or Presenter (Owner is permanent)
- ❌ Admin/Presenter → Owner (Cannot assign Owner role)
- ❌ Your own role if you're the only Admin

### Step-by-Step: Changing a Role

#### Step 1: Open Team Management

1. Go to **Settings → Team Management**
2. Find the user in the Team Members list
3. Locate the role dropdown next to their name

**Screenshot Placeholder:** *Team member with role dropdown highlighted*

#### Step 2: Select New Role

Each non-Owner user has a dropdown showing:

```
┌─────────────────────────────────┐
│  admin@company.com              │
│  [Admin          ▼]  [🗑️]      │
│   ↓                             │
│  [• Admin                  ]    │
│  [  Presenter              ]    │
└─────────────────────────────────┘
```

Click the dropdown and select the new role:
- Choose **"Admin"** to grant management privileges
- Choose **"Presenter"** to change to presentation-only access

#### Step 3: Confirm the Change

A confirmation dialog appears:

> **Change admin@company.com's role to Presenter?**
>
> This will remove admin privileges and grant presentation access.

Options:
- **OK** - Proceed with the role change
- **Cancel** - Abort the change

**Why confirmation is required:**
- Role changes affect user access immediately
- Prevents accidental changes
- Ensures you understand the impact

#### Step 4: Change Takes Effect

After confirming:
- ✅ Role updates immediately
- ✅ Icon changes (Shield → Microphone or vice versa)
- ✅ User's access changes instantly
- ✅ User may need to refresh their browser to see new features
- ✅ Success message appears

### Understanding Role Change Impact

#### Changing Admin → Presenter

**User LOSES:**
- Access to Event creation and editing
- Team Management access
- Reports and analytics viewing
- QR code generation ability

**User GAINS:**
- Ability to join events as a presenter
- Access to timer controls during events
- Presenter-specific features

**Use Case Example:**
Sarah was helping manage events but now needs to focus on delivering presentations. Change her from Admin to Presenter so she can join events.

#### Changing Presenter → Admin

**User LOSES:**
- Ability to join events as a presenter
- Timer control access during presentations
- Presenter slot claiming

**User GAINS:**
- Event creation and editing
- Team Management access
- Reports and analytics viewing
- QR code generation

**Use Case Example:**
Mike has been presenting but is taking on more responsibility. Promote him from Presenter to Admin so he can help manage events and team members.

### Role Change Restrictions

#### Cannot Change Owner Role

If you try to change the Owner's role, you'll see:

> **Error:** Cannot change the owner role

**Why?**
- Organization must always have an Owner
- Owner role is tied to the account that created the organization
- Ensures billing and subscription accountability

#### Cannot Remove Last Admin

The system prevents scenarios where no one can manage the organization:

> **Warning:** Cannot change role. At least one Admin must remain.

**Why?**
- Someone needs to be able to manage the organization
- Prevents locking yourself out of admin features
- If Owner changes their mind, someone can still help

### Verifying Role Changes

After changing a role, verify the change:

1. **Check the icon** - Should reflect the new role (Shield or Microphone)
2. **Check the label** - Should show the new role name
3. **Check user count** - Both roles count toward limit, so count shouldn't change
4. **Have user test** - Ask the user to log in and verify their new access

**Screenshot Placeholder:** *Team member list showing role change result*

### Role Change Best Practices

1. **Communicate First** - Tell the user before changing their role
2. **Explain Impact** - Make sure they understand what access they'll gain/lose
3. **Verify Change** - Confirm the role updated correctly
4. **Test Access** - Have the user verify their new capabilities
5. **Document Changes** - Keep track of who has which role and why

---

## Event Access and Security

### How Presenters Access Events

SyncCue uses a secure QR code and link system for presenters to access events. This keeps events private while making access convenient.

### The Access Flow

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN/OWNER                                            │
│                                                         │
│  1. Create Event                                        │
│  2. Assign Presenters                                   │
│  3. Generate QR Code                                    │
│  4. Share QR Code with presenters                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  PRESENTER                                              │
│                                                         │
│  1. Scan QR Code                                        │
│  2. Select Name from list                               │
│  3. Enter PIN (if required)                             │
│  4. Claim presenter slot                                │
│  5. Access timer controls                               │
└─────────────────────────────────────────────────────────┘
```

### Security Levels

SyncCue supports three security levels for event access:

#### Level 1: Open Access (No PIN)
- **Who should use:** Internal events, trusted team
- **Security:** Basic - anyone with the link can join
- **Setup:** No additional configuration needed
- **User Experience:** Fastest - scan, select name, join

#### Level 2: PIN Optional (Recommended)
- **Who should use:** Most events
- **Security:** Medium - users can verify with PIN but it's not required
- **Setup:** Configure PINs for presenters in Team Management
- **User Experience:** Can skip PIN or enter for verification
- **Best for:** Balancing security and convenience

#### Level 3: PIN Required
- **Who should use:** High-security events, external presenters
- **Security:** High - must enter valid PIN to access
- **Setup:** Configure PINs for all presenters
- **User Experience:** Must enter PIN to proceed
- **Best for:** Maximum security scenarios

### Setting Up Presenter PINs

#### Creating a PIN for a Presenter:

**Note:** This feature is managed through the Presenter management system in Events.

1. When creating or editing an event
2. Add presenters to the event
3. Each presenter can have a PIN assigned
4. PINs are stored securely and verified server-side

#### PIN Requirements:
- **Length:** 4-6 digits
- **Format:** Numbers only
- **Uniqueness:** Each presenter should have a unique PIN
- **Expiration:** Can be set to expire after a time period
- **Reset:** Admins can reset PINs if forgotten

### PIN Security Features

#### Failed Attempt Lockout:
- **Attempts Allowed:** 5 incorrect PIN entries
- **Lockout Duration:** 30 minutes
- **Warning Messages:** Shows remaining attempts after each failure
- **Example:** "Invalid PIN. 3 attempts remaining."

**Screenshot Placeholder:** *PIN entry screen showing attempt warning*

#### Account Locked State:

When locked, the presenter sees:

> 🔒 **Account Locked**
>
> This account is temporarily locked due to too many failed PIN attempts.
> Please contact the event organizer.

**How to unlock:**
- Wait 30 minutes for automatic unlock
- Contact an Admin to reset the PIN
- Admin can manually unlock the account

#### PIN Indicators:

In the Team Management view, presenters with PINs show:
- 🛡️ **Green Shield Icon** - "PIN Protected"
- Indicates enhanced security is enabled
- Helps admins track which presenters have PIN protection

**Screenshot Placeholder:** *Team member list showing PIN protection indicator*

### The Presenter Join Experience

#### Step 1: Scanning the QR Code

1. **Admin generates QR code** in Event Details
2. **QR code displayed** at event location (screen, printout, etc.)
3. **Presenter scans** with their phone camera
4. **Browser opens** to the event join page

**Screenshot Placeholder:** *QR code modal with generated code*

#### Step 2: Event Information Screen

The presenter sees:
- **Event Name** - "Annual Conference 2025"
- **Event Description** - Optional event details
- **Event Date/Time** - When the event is scheduled
- **Presenter Count** - How many presenters are assigned

Example display:
```
┌─────────────────────────────────────────┐
│  Annual Conference 2025                 │
│  Select your presenter name             │
│                                         │
│  Welcome to our annual event!           │
│                                         │
│  📅 January 15, 2025 at 2:00 PM        │
│  👥 5 Presenters                        │
└─────────────────────────────────────────┘
```

#### Step 3: Selecting Name

Available presenters show as selectable cards:

```
┌─────────────────────────────────────────┐
│  ☑️  John Smith                         │
│     Available                           │
│     🛡️ PIN Protected                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ☐  Sarah Johnson                       │
│     Available                           │
└─────────────────────────────────────────┘
```

**Indicators:**
- ✅ **Checkmark** - Currently selected
- 🛡️ **Shield** - PIN required or available
- 🔒 **Lock** - Account is locked
- ⏰ **Clock** - Already claimed by someone else

#### Step 4: PIN Entry (If Required)

If the presenter has a PIN configured:

```
┌─────────────────────────────────────────┐
│  🛡️ Enter Your PIN                      │
│                                         │
│  ┌───────────────────────────────┐     │
│  │        • • • •                 │     │
│  └───────────────────────────────┘     │
│           [👁️ Show/Hide]               │
│                                         │
│  [Verify PIN & Continue]                │
│                                         │
│  [Skip PIN (Not Recommended)]           │
│  (Only shown if PIN is optional)        │
└─────────────────────────────────────────┘
```

**Features:**
- **Password Field** - Hides PIN by default
- **Show/Hide Toggle** - Eye icon to reveal PIN
- **Enter Key Support** - Press Enter to submit
- **Skip Option** - Available only if PIN is optional
- **Error Messages** - Clear feedback on invalid PIN

**Screenshot Placeholder:** *PIN entry interface with masked input*

#### Step 5: Claiming the Slot

After successful PIN verification (or if no PIN):

1. **"Continue as [Name]"** button becomes active
2. Click to claim the presenter slot
3. Brief "Claiming slot..." loading state
4. Success confirmation appears

#### Step 6: Success and Redirect

```
┌─────────────────────────────────────────┐
│  ✅ Success!                            │
│                                         │
│  Presenter slot claimed successfully    │
│                                         │
│  Redirecting to your timer view...      │
└─────────────────────────────────────────┘
```

After 2 seconds:
- **Automatic redirect** to presenter timer interface
- **Session token** stored for authentication
- **Timer controls** immediately available

### Access Monitoring (Admin View)

Admins can monitor presenter access in real-time:

#### Access Management Panel

Located in Event Details, shows:

**QR Code Statistics:**
- **Scans:** How many times the QR code was scanned
- **Maximum Uses:** Limit on total scans (if set)
- **Example:** "15 / 50" scans used

**Slot Claims:**
- **Claimed:** How many presenters have joined
- **Total Slots:** Total presenters assigned
- **Example:** "3 / 5" presenters claimed

**Presenter Status:**
Each presenter shows:
- ✅ **Claimed** - Presenter has joined (green background)
  - Shows timestamp: "Claimed 2:15 PM"
- ⏰ **Pending** - Waiting to join (gray background)
  - Shows "Available"

**Screenshot Placeholder:** *Access Management panel showing claimed and pending presenters*

#### Recent Activity Log:

Shows last 10 access events:
- "QR code scanned" - Someone viewed the event page
- "John Smith claimed slot" - Presenter successfully joined
- Each entry shows timestamp

**Example:**
```
Recent Activity

  John Smith claimed slot
  January 15, 2025 at 2:15 PM

  QR code scanned
  January 15, 2025 at 2:14 PM

  Sarah Johnson claimed slot
  January 15, 2025 at 2:10 PM
```

### QR Code Generation

#### Creating a QR Code:

1. Open an event in Event Details
2. Click **"QR Code"** button in the top actions area
3. QR code generates instantly
4. Modal displays the code and sharing options

**Screenshot Placeholder:** *QR Code modal with download and share options*

#### QR Code Options:

- **Download as Image** - Save PNG to share digitally
- **Print** - Direct print for physical display
- **Copy Link** - Get the direct URL for email/messaging
- **Regenerate** - Create a new code (invalidates old one)

#### QR Code Best Practices:

1. **Display Prominently** - Make it easy to find at the event
2. **Test Before Event** - Scan it yourself to verify it works
3. **Have Backup** - Keep a printed backup in case of technical issues
4. **Size Matters** - Print large enough to scan from a distance
5. **Keep Secure** - Don't share publicly if event is private

### Security Best Practices

#### For Admins:

1. **Use PIN Protection** for events with external presenters
2. **Set PIN Required** for high-security events
3. **Monitor Access Logs** to see who's joining
4. **Regenerate QR Codes** if they're accidentally shared
5. **Set Expiration** on access tokens for time-limited events
6. **Review Claimed Slots** before event starts

#### For Presenters:

1. **Keep PIN Private** - Don't share with others
2. **Join Early** - Claim your slot before the event starts
3. **Verify Your Name** - Make sure you're selecting the right slot
4. **Report Issues** - Tell an admin immediately if you can't access
5. **Don't Share Links** - QR codes are for assigned presenters only

---

## Common Team Structures

### Small Team (1-6 people)

**Composition:**
- 1 Owner
- 0-1 Admin
- 2-4 Presenters

**Best For:**
- Small businesses
- Startups
- Single-event teams
- Department within larger organization

**Example:**
```
👑 Owner (CEO)
🛡️ Admin (Event Manager)
🎤 Presenter (Sales Lead)
🎤 Presenter (Marketing Lead)
🎤 Presenter (Product Manager)
```

**Recommended Plan:** Trial or Pro - Starter (5 users)

**Why this works:**
- Owner handles billing and high-level decisions
- One Admin manages day-to-day event operations
- Multiple Presenters focus on content delivery
- Simple structure with clear responsibilities

---

### Medium Team (7-15 people)

**Composition:**
- 1 Owner
- 2-3 Admins
- 5-12 Presenters

**Best For:**
- Growing companies
- Regional events
- Multiple concurrent events
- Training organizations

**Example:**
```
👑 Owner (Operations Director)
🛡️ Admin (Event Coordinator)
🛡️ Admin (Technical Director)
🎤 Presenter Team (8-10 speakers)
```

**Recommended Plan:** Pro - Growth (10 users) or Pro - Business (20 users)

**Why this works:**
- Multiple Admins can divide responsibilities
- One Admin for event setup, one for presenter management
- Larger presenter pool for various events
- Can run multiple events simultaneously

---

### Large Team (16+ people)

**Composition:**
- 1 Owner
- 3-5 Admins
- 15+ Presenters

**Best For:**
- Enterprise organizations
- Conference organizers
- Training companies
- Multi-location teams

**Example:**
```
👑 Owner (Chief Operating Officer)
🛡️ Admin (Senior Event Manager)
🛡️ Admin (Regional Coordinator - East)
🛡️ Admin (Regional Coordinator - West)
🛡️ Admin (Technical Lead)
🎤 Presenter Pool (20+ speakers)
```

**Recommended Plan:** Pro - Enterprise (Unlimited users)

**Why this works:**
- Owner focuses on strategy and billing
- Multiple Admins handle different regions or event types
- Large presenter pool for flexibility
- Can scale indefinitely without hitting limits

---

### Specialized Structures

#### Training Organization

**Focus:** Regular training sessions with rotating instructors

```
👑 Owner (Training Director)
🛡️ Admin (Curriculum Manager) - Creates events
🛡️ Admin (Logistics Coordinator) - Manages QR codes
🎤 Presenter (12 trainers)
```

**Key Features:**
- Admins create standardized events
- Large presenter pool rotates through events
- Presenters focus purely on delivery

---

#### Conference Organizer

**Focus:** Large annual or quarterly events

```
👑 Owner (Conference Chair)
🛡️ Admin (Program Director)
🛡️ Admin (Speaker Liaison)
🛡️ Admin (Technical Producer)
🎤 Presenter (30-50 speakers for various sessions)
```

**Key Features:**
- Multiple Admins handle different aspects
- Very large presenter pool
- High security with PIN requirements
- Detailed analytics and reporting

---

#### Corporate Communications

**Focus:** Internal company presentations and town halls

```
👑 Owner (Communications Director)
🛡️ Admin (Executive Liaison) - C-suite events
🛡️ Admin (HR Coordinator) - All-hands meetings
🎤 Presenter (Department heads)
🎤 Presenter (Team leads)
```

**Key Features:**
- Admins aligned with different internal stakeholders
- Presenters are senior company staff
- Regular recurring events
- Simple security (PIN optional)

---

### Team Structure Decision Guide

#### Ask Yourself:

1. **How many events do you run?**
   - 1-2/month: Small team with 1 Admin
   - 3-10/month: Medium team with 2-3 Admins
   - 10+/month: Large team with 3+ Admins

2. **How many people present?**
   - Under 5: Small team
   - 5-15: Medium team
   - 15+: Large team

3. **Who creates events?**
   - Just you: You're Owner + Admin roles overlap
   - 1-2 people: Assign 1-2 Admins
   - Multiple teams: Assign Admin per team

4. **Security requirements?**
   - Internal only: PIN Optional
   - External presenters: PIN Required
   - Public events: Consider PIN Optional with monitoring

5. **Budget considerations?**
   - Tight budget: Start with Trial, upgrade as needed
   - Growing team: Pro - Growth for flexibility
   - Established org: Pro - Business or Enterprise

---

## Best Practices

### For Owners

#### Subscription Management
1. **Review Usage Monthly** - Check if you're approaching your user limit
2. **Plan Ahead** - Upgrade before you hit the limit, not after
3. **Track Costs** - Understand the per-user cost of your plan
4. **Annual Billing** - Consider annual plans for cost savings (if available)

#### Team Leadership
1. **Assign Admins Wisely** - Choose responsible, organized team members
2. **Document Policies** - Create guidelines for event creation and management
3. **Regular Audits** - Review team member list quarterly
4. **Remove Inactive Users** - Free up slots and improve security
5. **Communicate Changes** - Tell team when you change subscription plans

#### Security
1. **Enable Two-Factor Auth** - Protect your Owner account (if available)
2. **Use Strong Passwords** - Your account controls billing and team
3. **Review Access Logs** - Check who's accessing events regularly
4. **Set Security Policies** - Decide when PINs are required vs. optional

---

### For Admins

#### Event Management
1. **Plan Events Early** - Create events well before the actual date
2. **Test QR Codes** - Always scan your QR code before sharing
3. **Assign Clear Names** - Use full names for presenter identification
4. **Set Realistic Timers** - Give presenters adequate time with small buffer
5. **Send Reminders** - Let presenters know when to scan QR code

#### Team Coordination
1. **Onboard New Members** - Walk them through their role and access
2. **Document Processes** - Write down how your team uses SyncCue
3. **Create Templates** - Save common event structures for reuse
4. **Monitor Attendance** - Check Access Management before events
5. **Gather Feedback** - Ask presenters what would improve their experience

#### Presenter Support
1. **Set Up PINs** - Configure PINs for regular presenters
2. **Provide Instructions** - Send clear joining instructions
3. **Be Available** - Be ready to help during events
4. **Test Access** - Have presenters test joining before important events
5. **Backup Plans** - Know how to reset PINs or regenerate QR codes quickly

---

### For Presenters

#### Preparation
1. **Join Early** - Claim your slot at least 15 minutes before event
2. **Test Your Device** - Make sure your phone can scan QR codes
3. **Save Your PIN** - Store it securely in a password manager
4. **Check Event Details** - Know your speaking time and order
5. **Have Backup** - Ask admin for direct link in case QR fails

#### During Events
1. **Watch Your Timer** - Pay attention to warning colors
2. **Respect Time Limits** - Stay within your allocated time
3. **Use Buffer Time** - The extra minutes are for transitions, not content
4. **Complete Timer** - Mark as complete when done to help with analytics
5. **Report Issues** - Tell admins immediately if something goes wrong

#### Security
1. **Protect Your PIN** - Don't share with other presenters
2. **Don't Screenshot QR Codes** - They should be scanned live
3. **Log Out After** - Close the browser tab when event is complete
4. **Report Locked Account** - Contact admin if you get locked out
5. **Update PIN Regularly** - Ask admin to reset periodically for security

---

### For Everyone

#### Communication
1. **Use Clear Names** - Real names make organization easier
2. **Update Contact Info** - Keep email addresses current
3. **Respond to Invitations** - Accept or decline invitations promptly
4. **Ask Questions** - Reach out to admins if confused
5. **Give Feedback** - Share what works and what doesn't

#### Security Hygiene
1. **Strong Passwords** - Use unique passwords for your account
2. **Secure Devices** - Lock your phone/computer
3. **Don't Share Accounts** - Each person should have their own login
4. **Report Suspicious Activity** - Tell Owner/Admin immediately
5. **Keep Software Updated** - Use current browser versions

#### Professional Use
1. **Be Punctual** - Join events on time
2. **Be Prepared** - Know your role and responsibilities
3. **Be Respectful** - Honor time limits and other presenters' slots
4. **Be Collaborative** - Help teammates when they need assistance
5. **Be Professional** - Treat SyncCue like any other business tool

---

## Troubleshooting

### Common Issues and Solutions

#### "Cannot invite user - at user limit"

**Problem:** You've reached your subscription's user limit.

**Solutions:**
1. **Upgrade Plan** - Go to Settings → Upgrade to Pro
2. **Remove Inactive Users** - Free up slots by removing old team members
3. **Change Roles** - Consider if any Admins could switch to Owner doing admin tasks
4. **Wait for Departures** - If someone is leaving soon, wait to invite replacement

**Remember:** Owner doesn't count toward limit!

---

#### "This access link has expired"

**Problem:** Presenter trying to join with old QR code.

**Solutions:**
1. **Generate New QR Code** - Admin: Go to Event Details → QR Code → Regenerate
2. **Check Event Date** - Tokens may expire after event time passes
3. **Verify Event Status** - Make sure event wasn't deleted
4. **Share New Link** - Send the new QR code or link to presenters

**Prevention:** Set appropriate expiration times when generating QR codes.

---

#### "This presenter slot has already been claimed"

**Problem:** Someone else already claimed the presenter slot.

**Solutions:**
1. **Check Name Selection** - Make sure you selected the correct name
2. **Contact Admin** - Ask admin to check who claimed the slot
3. **Verify Assignment** - Confirm you're actually assigned to this event
4. **Admin Reset** - Admin can reset assignments if error occurred

**Prevention:** Join events early to claim your slot before others.

---

#### "Account locked due to failed PIN attempts"

**Problem:** Entered wrong PIN too many times.

**Solutions:**
1. **Wait 30 Minutes** - Account unlocks automatically
2. **Contact Admin** - Ask admin to manually unlock or reset PIN
3. **Verify PIN** - Make sure you have the correct PIN before trying again
4. **Check Caps Lock** - Ensure no keyboard issues

**Prevention:** Store PIN securely and verify before entering.

---

#### "Cannot change role - must have at least one admin"

**Problem:** Trying to change last Admin to Presenter.

**Solutions:**
1. **Promote Another User First** - Make someone else an Admin before changing this person
2. **Owner Can Admin** - Owner has all Admin capabilities
3. **Invite New Admin** - Add another Admin before demoting current one

**Prevention:** Maintain at least 2 people with Admin capabilities.

---

#### "Cannot remove this member"

**Problem:** Trying to remove a user with restrictions.

**Possible Causes:**
1. **Trying to Remove Owner** - Owner cannot be removed
2. **Removing Yourself** - Cannot remove your own account
3. **Database Error** - System error preventing removal

**Solutions:**
1. **Owner Removal** - Owner accounts cannot be deleted
2. **Self-Removal** - Ask another Admin to remove you
3. **Technical Issue** - Contact support if other removal fails

---

#### QR Code won't scan

**Problem:** Phone camera can't read the QR code.

**Solutions:**
1. **Improve Lighting** - Make sure there's adequate light
2. **Adjust Distance** - Move phone closer or farther from code
3. **Clean Camera** - Wipe phone camera lens
4. **Use QR App** - Try a dedicated QR scanner app
5. **Manual Link** - Ask admin for the direct URL
6. **Regenerate Code** - Admin can create a new QR code

**Prevention:** Print QR codes at adequate size (min 2x2 inches).

---

#### Not receiving invitation emails

**Problem:** Invited user didn't get the invitation email.

**Solutions:**
1. **Check Spam Folder** - Email may be filtered as spam
2. **Verify Email Address** - Admin: Check spelling in invitation
3. **Whitelist Domain** - Add SyncCue's domain to safe senders
4. **Resend Invitation** - Admin: Cancel and send new invitation
5. **Use Alternate Email** - Try different email address

**Prevention:** Use corporate/professional email addresses.

---

#### "Cannot access this event"

**Problem:** Presenter can't join even with valid link.

**Possible Causes:**
1. **Not Assigned** - Presenter wasn't added to this event
2. **Wrong Event** - Scanning QR for different event
3. **Event Deleted** - Event was removed
4. **Permission Issue** - Database permission error

**Solutions:**
1. **Verify Assignment** - Admin: Check presenter is added to event
2. **Check Event Name** - Make sure it's the correct event
3. **Restore Event** - Admin: Check Recently Deleted if applicable
4. **Contact Support** - If technical issue persists

---

#### Timer controls not responding

**Problem:** Presenter can't start/stop timer during event.

**Solutions:**
1. **Refresh Page** - Reload the browser tab
2. **Check Internet** - Verify stable connection
3. **Try Different Browser** - Use Chrome, Safari, or Firefox
4. **Clear Cache** - Clear browser cache and cookies
5. **Rejoin Event** - Exit and rejoin through QR code

**Prevention:** Test timer controls before event starts.

---

#### "Session expired - please rejoin"

**Problem:** Presenter's session timed out.

**Solutions:**
1. **Scan QR Code Again** - Rejoin the event
2. **New Session Token** - System generates fresh authentication
3. **Clear Cookies** - Clear browser cookies if persistent

**Prevention:** Don't leave presenter page idle for long periods.

---

### Getting Help

If you can't resolve an issue:

#### For Team Members:
1. **Contact Your Admin** - They can often fix access issues
2. **Check This Guide** - Review relevant sections
3. **Ask Your Owner** - Owners have full system access

#### For Owners:
1. **Review Documentation** - Check all guide sections
2. **Contact Support** - Reach out to SyncCue support team
3. **Check Status Page** - Verify no system-wide issues

---

## FAQ

### General Questions

#### Q: Can an organization have multiple Owners?
**A:** No. Each organization has exactly one Owner - the person who created it. The Owner role cannot be transferred or duplicated.

#### Q: Does the Owner count toward my user limit?
**A:** No. The Owner account is exempt from the user limit. Only Admins and Presenters count toward your subscription limit.

#### Q: Can I transfer ownership to someone else?
**A:** No. The Owner role is permanently tied to the account that created the organization. This ensures billing accountability.

#### Q: What happens if the Owner leaves the company?
**A:** The Owner account should remain active even if the person leaves. Consider using a role account (e.g., admin@company.com) for the Owner if this is a concern. Contact support for assistance with this scenario.

---

### Role Questions

#### Q: Can someone be both an Admin and a Presenter?
**A:** No. Each user has exactly one role at a time. Admins manage events but cannot present, and Presenters deliver presentations but cannot manage events.

#### Q: Why can't Admins present in events?
**A:** This separation ensures clear responsibility boundaries. Admins focus on management and coordination, while Presenters focus on content delivery. This prevents conflicts and keeps roles simple.

#### Q: Can I change my own role?
**A:** No. Only Owners and other Admins can change your role. This prevents accidental role changes.

#### Q: How many Admins should I have?
**A:** It depends on your team size and event volume. General guideline:
- 1-10 total users: 1-2 Admins
- 11-20 total users: 2-3 Admins
- 20+ total users: 3-5 Admins

---

### Subscription Questions

#### Q: What happens when I reach my user limit?
**A:** You cannot invite new users until you either upgrade your plan or remove existing users. The "Invite Team Member" button will show "Upgrade to add more users."

#### Q: Can I temporarily add users beyond my limit?
**A:** No. The user limit is enforced at all times. You must upgrade to add users beyond your current limit.

#### Q: If I remove a user, can I immediately add someone new?
**A:** Yes. Removing a user frees up that slot immediately, and you can send a new invitation right away.

#### Q: Do pending invitations count toward my limit?
**A:** No. Only users who have accepted invitations and joined the organization count toward the limit.

#### Q: What happens if I downgrade and I'm over the limit?
**A:** You cannot downgrade to a plan with fewer users than you currently have. You must remove users first to get under the new limit before downgrading.

---

### Access and Security Questions

#### Q: Is a PIN required for all presenters?
**A:** No. PIN protection is optional and configured per event. You can choose:
- No PIN (open access)
- PIN Optional (recommended)
- PIN Required (high security)

#### Q: How do I reset a forgotten PIN?
**A:** Contact your Admin or Owner. They can reset your PIN in the Team Management section.

#### Q: What happens after 5 failed PIN attempts?
**A:** The account is locked for 30 minutes. After 30 minutes, it unlocks automatically. An Admin can also manually unlock it sooner.

#### Q: Can I use the same PIN for all my events?
**A:** Yes. Your PIN is associated with your presenter account, not individual events. You use the same PIN for all events where PIN protection is enabled.

#### Q: Can multiple presenters join using the same QR code?
**A:** Yes. The QR code is for the event, not individual presenters. Multiple people can scan it, then each selects their own name and (if required) enters their own PIN.

#### Q: How long is a QR code valid?
**A:** QR codes can be configured with expiration times. Common settings:
- Until event date
- 24 hours
- 7 days
- No expiration (until manually deactivated)

---

### Event Management Questions

#### Q: Can a Presenter create events?
**A:** No. Only Owners and Admins can create, edit, and delete events.

#### Q: Can I assign the same presenter to multiple timers in one event?
**A:** Yes. A presenter can have multiple speaking slots in a single event with different timers for each.

#### Q: What happens if a presenter doesn't join before the event?
**A:** The slot remains unclaimed. An Admin can manually start timers or reassign slots as needed during the event.

#### Q: Can I change presenter assignments after the event starts?
**A:** Yes. Admins can modify assignments at any time, even during live events.

---

### Team Management Questions

#### Q: Can I invite someone who already has a SyncCue account?
**A:** Yes. They'll receive an invitation to join your organization. They can accept and their existing account will be added with the role you specified.

#### Q: What if someone accidentally accepts the wrong invitation?
**A:** An Admin can remove them from that organization. They can then accept the correct invitation.

#### Q: Can someone be in multiple organizations?
**A:** Yes. A single SyncCue account can be a member of multiple organizations, potentially with different roles in each.

#### Q: How do I know if someone accepted my invitation?
**A:** Check the Team Management modal. Accepted invitations move from "Pending Invitations" to "Team Members."

#### Q: Can I cancel an invitation after sending it?
**A:** Yes. In Team Management, find the invitation under "Pending Invitations" and click the X button to cancel it.

---

## Quick Reference Card

### Role Identification

| Symbol | Role | Key Trait |
|--------|------|-----------|
| 👑 Yellow | **Owner** | Controls everything, doesn't count in limit |
| 🛡️ Blue | **Admin** | Manages events & team, counts in limit |
| 🎤 Green | **Presenter** | Delivers presentations, counts in limit |

---

### What Can I Do?

#### I'm an Owner:
- ✅ Manage subscription and billing
- ✅ Invite and remove team members
- ✅ Change user roles
- ✅ Create, edit, and delete events
- ✅ View all reports and analytics
- ❌ Cannot present in events

#### I'm an Admin:
- ✅ Invite and remove team members
- ✅ Change user roles
- ✅ Create, edit, and delete events
- ✅ Generate QR codes
- ✅ View all reports and analytics
- ❌ Cannot manage subscription
- ❌ Cannot present in events

#### I'm a Presenter:
- ✅ Join events via QR code
- ✅ Control my assigned timers
- ✅ Use PIN for secure access
- ❌ Cannot create or edit events
- ❌ Cannot manage team
- ❌ Cannot view reports

---

### Common Tasks

| Task | Steps |
|------|-------|
| **Invite User** | Settings → Team Management → Invite Team Member |
| **Change Role** | Settings → Team Management → Use dropdown next to user |
| **Create Event** | Events Tab → + Create Event |
| **Generate QR Code** | Event Details → QR Code button |
| **Join Event** | Scan QR Code → Select Name → Enter PIN → Join |
| **View Reports** | Reports Tab → Select event |
| **Upgrade Plan** | Settings → Upgrade to Pro |

---

### User Limit Quick Calc

```
Total Allowed Users = Subscription Limit + 1 Owner

Example with Pro - Growth (10 users):
  1 Owner (doesn't count)
  + 10 Admins/Presenters (counted)
  = 11 total people on team
```

---

### Emergency Contacts

| Issue | Contact |
|-------|---------|
| **Can't join event** | Your team's Admin |
| **Forgot PIN** | Your team's Admin |
| **Billing question** | Your team's Owner |
| **Technical problem** | SyncCue Support |
| **Account locked** | Your team's Admin |

---

### Security Levels

| Level | When to Use | Presenter Experience |
|-------|-------------|---------------------|
| **No PIN** | Internal, trusted team | Scan → Select → Join |
| **PIN Optional** | Most events (recommended) | Scan → Select → PIN or Skip → Join |
| **PIN Required** | External presenters, high security | Scan → Select → PIN (required) → Join |

---

### Best Practices Checklist

#### For Owners:
- [ ] Review user count monthly
- [ ] Audit team members quarterly
- [ ] Keep billing information current
- [ ] Maintain at least 2 Admins
- [ ] Document team policies

#### For Admins:
- [ ] Test QR codes before events
- [ ] Send reminder emails to presenters
- [ ] Monitor Access Management during events
- [ ] Create backup plans for technical issues
- [ ] Train new team members

#### For Presenters:
- [ ] Join events 15 minutes early
- [ ] Store PIN securely
- [ ] Respect time limits
- [ ] Report issues immediately
- [ ] Complete timer when finished

---

## Document Information

**Version:** 1.0
**Created:** January 2025
**Last Updated:** January 2025
**Maintained By:** SyncCue Team

**Related Documentation:**
- Event Management Guide
- Timer Controls Guide
- Analytics and Reports Guide
- Admin Quick Start Guide
- Presenter Quick Start Guide

**Need Help?**
- Email: support@synccue.com
- Documentation: docs.synccue.com
- In-app Help: Settings → Help & Resources

---

## Changelog

### Version 1.0 (January 2025)
- Initial release of User Roles Guide
- Complete documentation of all three roles
- Permission matrix and comparison tables
- Step-by-step instructions for all role-related tasks
- Security and access management guidelines
- Troubleshooting and FAQ sections
- Quick reference card

---

**End of User Roles Guide**
