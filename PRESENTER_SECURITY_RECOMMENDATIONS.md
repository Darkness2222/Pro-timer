# Presenter Authentication Security Recommendations

## Current System Overview

The application currently uses a two-step authentication process for presenters:

1. **Access Token**: Presenters scan a QR code or click a link containing an event access token
2. **Self-Assignment**: Presenters select their name from a list of available presenter slots
3. **Session Token**: After selection, they receive a unique session token for their presenter view

### Current Security Model

- Event organizers generate access tokens (shared via QR code)
- Access tokens can have:
  - Maximum use limits
  - Expiration dates
  - Activation/deactivation controls
- Presenter names are pre-assigned by event admins
- Once a presenter claims a slot, it cannot be claimed by others
- Session tokens provide persistent access to the presenter view

## Security Concerns

### Potential Vulnerabilities

1. **Shared Access Tokens**: Anyone with the QR code can access the assignment page
2. **Name-Only Verification**: No validation that the person selecting a name is the actual presenter
3. **Presenter Slot Hijacking**: First person to claim a slot gets access, regardless of identity
4. **Session Token Permanence**: Session tokens don't expire and could be shared
5. **No Authentication Audit**: Limited ability to verify presenter identity after assignment

## Recommended Security Enhancements

### Option 1: PIN/Password Authentication (Recommended)

#### Implementation

Add a secure PIN field to the presenter management system:

```sql
-- Add PIN field to organization_presenters table
ALTER TABLE organization_presenters
  ADD COLUMN access_pin text;

-- Optionally add PIN expiration
ALTER TABLE organization_presenters
  ADD COLUMN pin_expires_at timestamptz;
```

#### Workflow

1. **Admin Setup**:
   - Admin creates presenter entry
   - System generates (or admin sets) a 4-6 digit PIN
   - Admin shares PIN privately with the presenter (email, SMS, in-person)

2. **Presenter Access**:
   - Presenter scans QR code
   - Selects their name from the list
   - **NEW**: Enters their PIN to verify identity
   - Receives session token only after successful PIN verification

3. **Security Features**:
   - PINs can be time-limited (expire after event)
   - PINs can be single-use (invalidated after first login)
   - Failed PIN attempts are logged
   - Admin can reset PINs at any time

#### Advantages

- Adds authentication layer without complex infrastructure
- Easy for presenters to use (memorable codes)
- Admin has full control over PIN generation and distribution
- Can be implemented quickly
- Works well for events of all sizes

#### Disadvantages

- Requires secure PIN distribution channel
- PINs could potentially be shared (though this is traceable)
- Additional step for presenters

### Option 2: Unique Access Links Per Presenter

#### Implementation

Instead of one shared QR code, generate unique access tokens per presenter:

```sql
-- Modify event_presenter_assignments to include individual tokens
ALTER TABLE event_presenter_assignments
  ADD COLUMN individual_access_token text UNIQUE;
```

#### Workflow

1. **Admin Setup**:
   - Admin creates presenter entries
   - System generates unique access token per presenter
   - Admin shares individual links with each presenter

2. **Presenter Access**:
   - Presenter clicks their unique link
   - Automatically assigned to their slot (no selection needed)
   - Receives session token

#### Advantages

- No PIN management required
- Each presenter has a unique, trackable access method
- Simpler user experience (one-click access)
- Built-in access revocation (disable specific tokens)

#### Disadvantages

- More tokens to manage and distribute
- If a link is shared, anyone can access that presenter's slot
- Harder to manage last-minute presenter changes
- Not practical for large events with many presenters

### Option 3: Email Verification

#### Implementation

Link presenter access to verified email addresses:

```sql
-- Ensure email is required and verified
ALTER TABLE organization_presenters
  ALTER COLUMN email SET NOT NULL;

-- Add email verification tracking
ALTER TABLE organization_presenters
  ADD COLUMN email_verified boolean DEFAULT false,
  ADD COLUMN verification_token text UNIQUE,
  ADD COLUMN verification_sent_at timestamptz;
```

#### Workflow

1. **Admin Setup**:
   - Admin adds presenter with email address
   - System sends verification email to presenter
   - Presenter clicks verification link

2. **Presenter Access**:
   - Presenter scans QR code
   - Selects their name
   - **NEW**: System sends one-time access code to verified email
   - Presenter enters code to gain access

#### Advantages

- Highest security level
- Verifies presenter identity via email ownership
- Built-in communication channel with presenters
- Professional appearance

#### Disadvantages

- Requires email infrastructure
- More complex implementation
- Presenter must have email access during event
- Could be problematic if email is delayed or blocked

## Implementation Priority Recommendation

### Phase 1 (Immediate): PIN Authentication

Implement **Option 1 (PIN/Password)** because:
- Balances security with ease of use
- Quick to implement
- Doesn't require external dependencies
- Works offline/in low-connectivity environments
- Admin maintains full control
- Suitable for events of all sizes

### Phase 2 (Future): Enhanced Features

Consider adding:
- **Biometric Authentication**: For mobile devices that support it
- **Two-Factor Authentication**: For high-security events
- **Single Sign-On (SSO)**: For enterprise customers
- **Geofencing**: Restrict access based on event location

## Best Practices

Regardless of authentication method chosen:

1. **Logging & Audit Trails**:
   - Log all authentication attempts (successful and failed)
   - Track device info, IP addresses, and timestamps
   - Enable admin review of access logs

2. **Session Management**:
   - Implement session expiration (e.g., 12 hours after event)
   - Allow admin to revoke active sessions
   - Limit concurrent sessions per presenter

3. **Access Control**:
   - Implement rate limiting on authentication attempts
   - Lock accounts after multiple failed attempts
   - Provide clear error messages without revealing security details

4. **Communication**:
   - Send confirmation notifications when presenters access their view
   - Alert admins of unusual access patterns
   - Provide presenters with clear instructions

## Current Security Status

✅ **Implemented**:
- Access token management (max uses, expiration)
- Session token isolation
- Row Level Security (RLS) policies
- Access logging infrastructure

⚠️ **Missing** (Recommended to Add):
- Presenter identity verification
- PIN/password authentication
- Session expiration
- Failed attempt tracking
- Active session management

## Conclusion

**YES** - Add presenter authentication (preferably PIN-based) to prevent unauthorized access and verify presenter identity. The current system is functional for trusted environments but lacks verification mechanisms needed for production use with external presenters or public events.

The PIN authentication approach provides the best balance of:
- Security (verification of identity)
- Usability (simple for presenters)
- Control (admin manages all credentials)
- Flexibility (works in all environments)
- Auditability (tracks all access)

Implementation should be prioritized before deploying to production or using with external/untrusted presenters.
