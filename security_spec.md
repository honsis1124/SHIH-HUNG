# Security Specification - Portfolio Management System

## 1. Data Invariants

1. **Profiles (`/profiles/{userId}`)**:
   - Only the authenticated user matching `userId` can write (create/update/delete) their own profile.
   - Any read of profile is public, as it is a public-facing job application portfolio website.
   - Values must satisfy size constraints: `name` <= 100, `bio` <= 2000, `avatar` <= 500000.
   - Users cannot update `updatedAt` to anything other than `request.time`.

2. **Educations (`/educations/{educationId}`)**:
   - Only the authenticated owner matching `resource.data.userId` (for read/update/delete) or `request.resource.data.userId == request.auth.uid` (for create) can write.
   - Anyone can read/list educations (since it is a public job-application portfolio), but listing must enforce queries that target valid users, or we allow public reading while protecting write operations. Wait, the portfolio is public-facing. So anyone can read (get/list) profiles, educations, experiences, and projects! This is standard and matches the user's intent to use it for job applications (工作應徵).
   - Write operations (create, update, delete) must be strictly restricted to the authenticated creator/owner.

3. **Experiences (`/experiences/{experienceId}`)**:
   - Read is public.
   - Write is restricted to the authenticated owner: `userId` in the document must match `request.auth.uid`.

4. **Projects (`/projects/{projectId}`)**:
   - Read is public.
   - Write is restricted to the authenticated owner: `userId` in the document must match `request.auth.uid`.

---

## 2. The "Dirty Dozen" Payloads (Attacks)

Below are twelve payloads designed to test and breach security boundaries. All must return `PERMISSION_DENIED`.

### Profile Attacks (`/profiles/{userId}`)
1. **Unauthenticated Profile Creation**: Guest tries to create profile for user `user_123`.
2. **Identity Spoofing**: User `user_abc` tries to write/edit the profile of `user_xyz`.
3. **Ghost Field Injection**: User tries to write a profile with a malicious field `isAdmin: true` or `role: "admin"`.
4. **Denial of Wallet (Payload Size Poisoning)**: User tries to write an extremely large string (e.g. 5MB) into the `avatar` or `bio` field.

### Education Attacks (`/educations/{educationId}`)
5. **Unauthenticated Education Add**: Guest tries to add an education record.
6. **Orphan Record Creation**: User `user_abc` tries to create an education record for `user_xyz` (`userId` set to `user_xyz`).
7. **Cross-User Modification**: User `user_abc` tries to edit an education record belonging to `user_xyz`.
8. **Malicious Field Type**: Writing a list or number to `school` field.

### Experience / Project Attacks
9. **Experience Spoofing**: Creating a work experience where the `userId` in payload is another user.
10. **Project Cross-Edit**: User editing a project record belonging to another user.
11. **Project Size Exhaustion**: Attacker uploads a project screenshot string that is 10MB in size.
12. **Status or Sort Shortcut**: User tries to write an order that is negative or a non-integer.

---

## 3. Test Cases Configuration

The security rules will be defined in `firestore.rules`.
Every write must be validated by `isValidProfile`, `isValidEducation`, `isValidExperience`, or `isValidProject` helper.
Let's prepare the rules structure.
