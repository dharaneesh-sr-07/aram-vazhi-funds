# Aram Vazhi Funds

PROJECT NAME:
அறம் வழிக் குழு (AVK)

PROJECT TYPE:
Complete Full-Stack Financial Management Website

PROJECT STATUS:
Build a fully functional application, not just a UI prototype.

==================================================
1. PROJECT OBJECTIVE
==================================================

Build a complete, secure, responsive website for
அறம் வழிக் குழு.

The group currently has 10 members, including 2 Admins
and 8 regular Members.
Totally 10 members.

The purpose of this website is to replace the group's
paper notebook and maintain all financial records digitally.

The application must support:

1. Secure login for all 10 members.
2. Two Admin accounts with administrative permissions.
3. Eight Member accounts with read-only permissions.
4. Monthly subscription tracking.
5. Yearly subscription tracking.
6. Money given to members.
7. Money returned by members.
8. Individual member dashboards.
9. Admin dashboard.
10. Member management.
11. Financial reports.
12. Transaction history.
13. Audit logs.
14. Responsive mobile and desktop interfaces.

IMPORTANT TERMINOLOGY:

Never use the words "Loan" or "கடன்" anywhere in
the website's interface, headings, buttons, reports,
or member-facing documentation.

Use the following terms:

Money Taken = பணம் பெற்ற விவரம்
Amount Taken = பெற்ற தொகை
Extra Amount = கூடுதல் தொகை
Total Amount to Return = திருப்பித் தர வேண்டிய மொத்த தொகை
Money Returned = பணம் திரும்பச் செலுத்தியது
Amount Returned = திரும்பச் செலுத்திய தொகை
Remaining Amount = மீதமுள்ள தொகை
Monthly Subscription = மாத சந்தா
Yearly Subscription = புடவை சந்தா
Member Dashboard = உறுப்பினர் முகப்பு
Admin Dashboard = நிர்வாகி முகப்பு

Use Tamil as the primary language and English
translations wherever useful.

==================================================
2. TECHNOLOGY STACK
==================================================

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- React Router
- Recharts

Backend:
- Supabase
- PostgreSQL
- Supabase Authentication
- PostgreSQL Row Level Security (RLS)
- Secure server-side administrative operations

Deployment:
- Vercel for frontend hosting
- Supabase for database and authentication

Requirements:
- Use compatible stable package versions.
- Use real database records.
- Do not use mock data in production.
- Do not require OpenAI, Gemini, Anthropic,
  or any other AI API.
- Do not put secret keys in frontend code.
- Do not use localStorage as the primary database.
- Do not create a fake login system.

==================================================
3. GROUP INFORMATION
==================================================

Group Name:
அறம் வழிக் குழு

English Name:
Aram Vazhi Kuzhu

Tagline:
நம்பிக்கை • ஒற்றுமை • வெளிப்படைத்தன்மை

Group Size:
10 members

Administrators:
2

Regular Members:
8

Monthly Subscription:
₹100 per member.

Yearly Subscription:
₹300 per member.

Expected Monthly Collection:
10 × ₹100 = ₹1,000.

Expected Yearly Collection:
10 × ₹300 = ₹3,000.

Expected Annual Monthly-Subscription Collection:
₹1,000 × 12 = ₹12,000.

These are expected collections, not guaranteed collections.
Calculate actual totals from recorded payments.

==================================================
4. INITIAL MEMBER ACCOUNTS
==================================================

Create the following 10 member profiles.

Use the exact names and usernames provided below.

IMPORTANT:
The usernames below are login identifiers.

Do not require members to use email addresses as
their usernames in the user interface.

Implement username-based login securely by using
a trusted server-side authentication operation that
maps the username to the corresponding Supabase Auth
account.

Never expose an Admin service-role key in the frontend.

All usernames must be unique.

--------------------------------------------------
ACCOUNT 1: ADMIN
--------------------------------------------------

Full Name:
Dharaneesh S

Username:
Dharaneesh

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Role:
Admin

Permissions:
- View all members.
- Add new members.
- Edit member details.
- Deactivate and reactivate members.
- Record monthly subscription payments.
- Record yearly subscription payments.
- Record money given to members.
- Record money returned by members.
- View all financial transactions.
- View all reports.
- Export financial reports.
- View audit logs.
- Access all administrative pages.

--------------------------------------------------
ACCOUNT 2: ADMIN
--------------------------------------------------

Full Name:
Lakshmana Sarath E

Username:
Sarath

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Role:
Admin

Permissions:
- View all members.
- Add new members.
- Edit member details.
- Deactivate and reactivate members.
- Record monthly subscription payments.
- Record yearly subscription payments.
- Record money given to members.
- Record money returned by members.
- View all financial transactions.
- View all reports.
- Export financial reports.
- View audit logs.
- Access all administrative pages.

Both Admin accounts must have the same administrative
permissions.

--------------------------------------------------
ACCOUNT 3: MEMBER
--------------------------------------------------

Full Name:
Ashwin B

Username:
Ashwin

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal profile.
- View personal monthly subscription history.
- View personal yearly subscription history.
- View personal money-taken records.
- View personal money-returned history.
- View personal remaining amounts.
- View personal transaction history.

No administrative permissions.

--------------------------------------------------
ACCOUNT 4: MEMBER
--------------------------------------------------

Full Name:
Dravit P

Username:
Dravit

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

--------------------------------------------------
ACCOUNT 5: MEMBER
--------------------------------------------------

Full Name:
Akhil B

Username:
Akhil

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

--------------------------------------------------
ACCOUNT 6: MEMBER
--------------------------------------------------

Full Name:
Nithissh S

Username:
Nithissh

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

--------------------------------------------------
ACCOUNT 7: MEMBER
--------------------------------------------------

Full Name:
Dhivya Prabha E

Username:
Dhivya

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

--------------------------------------------------
ACCOUNT 8: MEMBER
--------------------------------------------------

Full Name:
Poovisha M

Username:
Poovisha

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

--------------------------------------------------
ACCOUNT 9: MEMBER
--------------------------------------------------

Full Name:
Riyashini M

Username:
Riyashini

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

--------------------------------------------------
ACCOUNT 10: MEMBER
--------------------------------------------------

Full Name:
Pranika V

Username:
Pranika

Role:
Member

Initial Password:
Use the initial password supplied by the group
administrator during secure account provisioning.

Permissions:
- View personal financial records only.
- Cannot edit financial records.
- Cannot access the Admin dashboard.
- Cannot view other members' records.

==================================================
5. SECURE ACCOUNT PROVISIONING
==================================================

Create all 10 accounts during initial setup.

Do not create public self-registration.

Use a secure administrative provisioning script
or server-side administrative endpoint.

The initial passwords are supplied separately by
the authorized group administrator during setup.

Requirements:

1. Create all 10 authentication accounts.
2. Assign each account the correct username.
3. Assign each account the correct full name.
4. Assign the correct role.
5. Link every account to a unique member profile.
6. Prevent duplicate usernames.
7. Prevent duplicate member profiles.
8. Ensure both Admins have administrative access.
9. Ensure the other eight accounts have Member access.
10. Record account creation in the audit log.

Never store plaintext passwords in PostgreSQL.

Never place passwords in:
- Source code.
- Git repositories.
- Frontend JavaScript.
- Public configuration files.
- Browser localStorage.
- Audit logs.
- Application error messages.

Use Supabase Authentication for password storage.

Passwords must be supplied through a secure setup
process, not embedded in the application source.

On first login:
- Require the user to change their initial password.
- Do not allow normal dashboard access until this is done.
- Require a strong new password.
- Provide a password recovery process.

Because usernames are used instead of email addresses,
implement username-to-account mapping securely on
the server side.

Do not expose a public endpoint that reveals email
addresses or authentication account identifiers.

If Supabase requires an email address for the chosen
authentication flow, implement a documented internal
account-mapping strategy.

Do not invent real email addresses for the members.

==================================================
6. PUBLIC HOMEPAGE
==================================================

Route:
/

Display:
- Group logo.
- அறம் வழிக் குழு.
- Tagline.
- Short introduction.
- Member Login.
- Admin Login.

Member Login:
- Navigate to /member-login.

Admin Login:
- Navigate to /admin-login.

Do not display financial records on this page.

Design:
- Modern green-and-white theme.
- Professional cards.
- Responsive layout.
- Clear Tamil text.
- Simple animations.
- Mobile-friendly design.

==================================================
7. LOGIN SYSTEM
==================================================

Member Login Page:
Route: /member-login

Admin Login Page:
Route: /admin-login

Both pages must include:

- Username.
- Password.
- Show/hide password button.
- Login button.
- Forgot password option.
- Loading indicator.
- Invalid-credentials message.
- Inactive-account message.
- Password-change-required message.

After successful login:

Dharaneesh → /admin
Sarath → /admin

Ashwin → /member
Dravit → /member
Akhil → /member
Nithissh → /member
Dhivya → /member
Poovisha → /member
Riyashini → /member
Pranika → /member

Determine permissions from trusted database records.

Never determine a user's role from the username
entered into the login form.

Never trust role information supplied by the browser.

Protect all routes and all database operations.

==================================================
8. ADMIN DASHBOARD
==================================================

Route:
/admin

Sidebar:

1. முகப்பு
2. உறுப்பினர் மேலாண்மை
3. மாத சந்தா
4. புடவை சந்தா
5. பணம் பெற்ற விவரம்
6. பணம் திரும்பப் பெற்ற விவரம்
7. அறிக்கைகள்
8. செயல்பாட்டு வரலாறு
9. அமைப்புகள்
10. வெளியேறு

Summary cards:

- Total Active Members.
- Monthly Subscription Collected.
- Yearly Subscription Collected.
- Total Amount Given.
- Total Amount Returned.
- Total Remaining Amount.

Show:
- Recent transactions.
- Pending monthly subscriptions.
- Pending yearly subscriptions.
- Members with outstanding amounts.
- Monthly collection chart.
- Yearly collection chart.
- Quick-action buttons.

All data must come from PostgreSQL.

Both Admin accounts must see the same group-wide
financial information.

==================================================
9. MEMBER MANAGEMENT
==================================================

Route:
/admin/members

Display:
- Member ID.
- Full Name.
- Username.
- Role.
- Account Status.
- Actions.

Features:
- Add member.
- Edit member details.
- Deactivate member.
- Reactivate member.
- View financial history.
- Initiate password reset.
- Search members.
- Filter by role.
- Filter by status.

Initially create the 10 specified accounts.

New members added later must receive unique member IDs.

Suggested IDs:

AVK001
AVK002
AVK003
AVK004
AVK005
AVK006
AVK007
AVK008
AVK009
AVK010

Do not permanently delete members with financial
history.

Use account deactivation to preserve records.

New members must be created through a trusted
administrative operation.

Never allow an Admin to create an account with
unvalidated or duplicate usernames.

Do not let a regular Member add or remove members.

==================================================
10. MONTHLY SUBSCRIPTION — மாத சந்தா
==================================================

Route:
/admin/monthly

Monthly amount:
₹100 per member.

Create one monthly obligation for each active
member for each month.

Display:
- Member Name.
- Month.
- Year.
- Amount Due.
- Amount Paid.
- Remaining Amount.
- Payment Status.
- Payment Date.

Statuses:
- Paid.
- Pending.
- Partial.

Admin actions:
- Record payment.
- Update permitted member details.
- View payment history.
- Filter by month and year.

Members can only view their own records.

Prevent duplicate obligations for the same member,
month, and year.

Support partial payments.

Do not mark payments as received automatically.

==================================================
11. YEARLY SUBSCRIPTION — புடவை சந்தா
==================================================

Route:
/admin/yearly

Yearly amount:
₹300 per member.

Display:
- Member Name.
- Year.
- Amount Due.
- Amount Paid.
- Remaining Amount.
- Payment Status.
- Payment Date.

Features:
- Record payment.
- Support partial payments.
- Filter by year.
- View historical records.
- Identify pending members.

Prevent duplicate yearly obligations.

Use the exact Tamil label:
புடவை சந்தா

==================================================
12. MONEY TAKEN — பணம் பெற்ற விவரம்
==================================================

Route:
/admin/money-taken

Create a form with:

- Member.
- Transaction ID.
- Date.
- Amount Taken.
- Extra Amount.
- Total Amount to Return.
- Notes.

Example:

Amount Taken = ₹1,000
Extra Amount = ₹100
Total Amount to Return = ₹1,100

Formula:

Total Amount to Return =
Amount Taken + Extra Amount

Do not assume the extra amount is always 10%.

The Admin must be able to enter the extra amount.

Generate unique transaction IDs, for example:

AVK-MT-2026-0001

Display:
- Transaction ID.
- Member Name.
- Date.
- Amount Taken.
- Extra Amount.
- Total Amount to Return.
- Amount Returned.
- Remaining Amount.
- Status.

Statuses:
- Active.
- Partially Returned.
- Fully Returned.

==================================================
13. MONEY RETURNED — பணம் திரும்பப் பெற்ற விவரம்
==================================================

Route:
/admin/money-returned

Create a form with:

- Member.
- Money-Taken Transaction.
- Amount Returned.
- Payment Date.
- Notes.

Example:

Total Amount to Return = ₹1,100
Amount Already Returned = ₹400
Remaining Amount = ₹700

If the member returns ₹200:

New Amount Returned = ₹600
New Remaining Amount = ₹500

Prevent returns greater than the outstanding balance.

Record each return as a separate transaction.

Do not overwrite transaction history.

Both Admin accounts may record returns.

Use secure transactional database operations to
prevent concurrent submissions from creating
incorrect balances.

==================================================
14. MEMBER DASHBOARD
==================================================

Route:
/member

Display:

- Welcome message.
- Member Name.
- Member ID.
- Account Status.
- Monthly Subscription Summary.
- Yearly Subscription Summary.
- Total Amount Taken.
- Total Amount Returned.
- Remaining Amount.

Show recent transactions.

Only display data belonging to the authenticated user.

Do not display:
- Other members' amounts.
- Other members' payment status.
- Other members' transaction history.
- Administrative controls.

==================================================
15. MEMBER SUBSCRIPTION PAGES
==================================================

Monthly page:
/member/monthly

Show:
- Month.
- Year.
- Amount Due.
- Amount Paid.
- Remaining Amount.
- Status.
- Payment Date.

Yearly page:
/member/yearly

Show:
- Year.
- Amount Due.
- Amount Paid.
- Remaining Amount.
- Status.
- Payment Date.

Members must not be able to edit any payment record.

==================================================
16. MEMBER MONEY-TAKEN PAGE
==================================================

Route:
/member/money

Display:
- Transaction ID.
- Date.
- Amount Taken.
- Extra Amount.
- Total Amount to Return.
- Amount Returned.
- Remaining Amount.
- Status.

Include the history of each return transaction.

The Member can view but cannot edit the records.

==================================================
17. MEMBER TRANSACTION HISTORY
==================================================

Route:
/member/history

Display:
- Monthly subscription payments.
- Yearly subscription payments.
- Money taken.
- Money returned.

Columns:
- Date.
- Transaction Type.
- Description.
- Amount.
- Reference ID.

Show newest transactions first.

Do not combine unrelated financial categories
into a misleading total.

==================================================
18. DATABASE TABLES
==================================================

Create the following PostgreSQL tables:

1. members
2. subscription_obligations
3. subscription_receipts
4. money_taken
5. money_returned
6. audit_logs

MEMBERS:

- id: UUID primary key.
- auth_user_id: UUID unique.
- member_code: unique text.
- username: unique text.
- full_name: text.
- role: admin or member.
- status: active or inactive.
- must_change_password: boolean.
- created_at: timestamp.
- updated_at: timestamp.

SUBSCRIPTION_OBLIGATIONS:

- id: UUID primary key.
- member_id: UUID foreign key.
- payment_type: monthly or yearly.
- period_month: nullable integer.
- period_year: integer.
- amount_due: numeric.
- created_at: timestamp.

Prevent duplicate monthly obligations for a member
in the same month and year.

Prevent duplicate yearly obligations for a member
in the same year.

SUBSCRIPTION_RECEIPTS:

- id: UUID primary key.
- obligation_id: UUID foreign key.
- amount_paid: numeric.
- payment_date: date.
- notes: nullable text.
- recorded_by: UUID.
- created_at: timestamp.

Each receipt must be preserved as a separate record.

MONEY_TAKEN:

- id: UUID primary key.
- tra

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aram-vazhi-funds.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2638b369-34a4-4cba-8917-69bed848352a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
