# App Review Notes: paste into App Store Connect → App Review Information → Notes

> Fill in the `<…>` placeholders before submitting. Everything else is written to be pasted as-is.

---

**1. Screen recording**
A screen recording captured on a physical iPhone running the latest iOS is available here: `<link to video>`.
It starts from launching the app and shows registration, sign-in, the main features, changing the password, and deleting the account (Profile → Delete Account).

**2. Purpose and audience**
Naqabti is the app of the `<legal name of the syndicate>`, the professional body that registers physicians.
Anyone can download it and create an account: physicians, medical students and health institutions, as well as members of the public who want the syndicate's news, events, library and branch information.
It replaces paper and in-person paperwork: members register, upload their degree and identity documents, request or renew their membership, see their payment records and certificates, receive official news and notifications, submit complaints and medical reports to the syndicate, and browse the syndicate's library, courses, events and branches.

**3. How to access the main features**
Demo account (approved physician with sample data):
- Email: `<demo email>`
- Password: `<demo password>`

After signing in:
- Home: profile summary, profile completion, quick actions.
- Menu → Memberships / Renew Membership: membership status and renewal request.
- Menu → Payments, Certifications: records issued by the syndicate.
- Menu → News, Events, Announcements, Library, Courses, Branches: public syndicate content.
- Menu → Complaints, Medical Reports: forms sent privately to the syndicate.
- Profile → Edit Profile → Change Password.
- Profile → Delete Account: permanently deletes the account and its personal data.

New accounts can be created with "Create account" on the sign-in screen. Registration requires an email verification code. New physician accounts are marked "pending review" until the syndicate approves the documents, so please use the demo account to see all features.

**4. External services**
- The syndicate's own backend at https://my.naqabti.ly (accounts, membership data, content).
- Google Firebase Cloud Messaging for push notifications.
- No third-party sign-in, no analytics or advertising SDKs, no AI services, no payment processor.

**Payments:** the app does not sell anything and has no in-app payments. Membership fees are paid to the syndicate in person or by bank transfer; the app only shows the record of those payments and lets the member request a renewal. These are dues for a real-world professional membership, consumed outside the app.

**User-generated content:** complaints and medical reports are private submissions from a member to the syndicate's staff. They are never shown to other users, so there is no public user-generated content.

**5. Regional differences**
The app works the same in all regions, in Arabic and English. There are no regional differences in features or content.

**6. Third-party material**
The app contains no protected third-party material. All content is published by the syndicate. Medical reports are submitted by physicians to the syndicate; the app does not provide medical advice or diagnosis.

**Privacy**
Privacy policy: https://my.naqabti.ly/privacy
Account deletion (also available on the web): https://my.naqabti.ly/account-deletion
