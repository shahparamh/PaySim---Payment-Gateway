# PaySim Frontend UI Documentation

This document explains the frontend user interface structure for the **PaySim Payment Gateway Platform**.

The frontend provides dashboards and interfaces for customers to simulate payments, manage payment methods, and track transactions.

---

# 1. Technology Stack

Frontend technologies used:

- HTML5
- CSS3
- JavaScript
- Bootstrap
- Chart.js (for analytics charts)

Design features:

- Dark / Light mode support
- Responsive dashboard layout
- Component-based UI
- Sidebar navigation

---

# 2. Layout Structure

All pages follow a **dashboard layout**.

Main layout sections:


┌─────────────────────────────┐
│ Top Navbar │
├──────────┬──────────────────┤
│ Sidebar │ Main Content │
│ Menu │ │
│ │ │
└──────────┴──────────────────┘


### Sidebar Navigation

Sections:

Home  
Payments  
Banking  
Settings  

Menu items:


Home

Payments

Make Payment

Transactions

Banking

My Methods

Add Method

Settings

My Profile

Logout


---

# 3. Login Page

Path:


/login.html


Features:

- Email input
- Password input
- Role selector
- Login button
- Register link
- Forgot password link

Components:


Email field
Password field
Login button
Role dropdown
Register link


Purpose:

Authenticates user before accessing dashboard.

---

# 4. Dashboard Page

Path:


/dashboard.html


Purpose:

Provides an overview of account activity.

Dashboard cards:


Spent This Month
Successful Payments
Wallet Balance
Membership Status


Example metrics:

- monthly spending
- payment success rate
- wallet balance
- user membership tier

---

# 5. Spending Trends Chart

Displayed on dashboard.

Uses:


Chart.js


Shows:


Weekly spending distribution

Thu
Fri
Sat
Sun
Mon
Tue
Wed


Purpose:

Visualize user payment activity.

---

# 6. Quick Action Cards

Located below spending chart.

Cards include:


Make Payment
Add Payment Method
View Transactions


### Make Payment

Redirects to:


/make-payment.html


---

# 7. Recent Transactions

Displayed on dashboard.

Columns:


TXN ID
Payment Method
Amount
Status
Date


Statuses:


success
failed
pending


---

# 8. Make Payment Page

Path:


/make-payment.html


Layout:


┌───────────────────────────┬──────────────────────┐
│ Payment Methods │ Payment Details │
│ │ │
│ Card │ Receiver │
│ Bank │ Amount │
│ Wallet │ Pay Button │
└───────────────────────────┴──────────────────────┘


Left panel:

Available payment methods:

- Credit Cards
- Bank Accounts
- Net Banking
- Wallet

Right panel:

Payment form:


Select receiver
Enter amount
Pay now button


---

# 9. Transaction History Page

Path:


/transactions.html


Features:

Filters:


All Statuses
All Modes
Results per page


Table columns:


TXN ID
Method
Amount
Type
Status
Mode
Date


Modes:


simulator
platform


Purpose:

View full transaction history.

---

# 10. Payment Methods Page

Path:


/my-methods.html


Displays stored payment methods.

Sections:


Wallets
Credit Cards
Bank Accounts


Wallet card shows:


Wallet balance
Currency
Wallet ID
Top-up option


Credit card card shows:


Card number
Credit limit
Used credit
Expiry date
Pay bill button


Bank account card shows:


Bank name
Account type
Account balance


---

# 11. Add Payment Method Page

Path:


/add-method.html


Allows adding payment methods.

Method options:


Wallet
Credit Card
Bank Account
Net Banking


Example wallet form:


Initial Balance
Currency
Create Wallet


Future additions may include:

- credit card form
- bank account form
- UPI linking

---

# 12. Dark Mode Support

Toggle available in navbar.

Modes:


Light Mode
Dark Mode


Benefits:

- improved readability
- better UX at night
- modern fintech UI

---

# 13. UI Components

Reusable components used across pages:

Cards  
Tables  
Buttons  
Forms  
Badges  
Charts  

Status badge colors:


Success → Green
Failed → Red
Pending → Orange
Simulator → Grey
Platform → Blue


---

# 14. User Roles Supported

Frontend supports:


Customer
Merchant
Admin


Current UI is designed for:


Customer dashboard


Merchant and Admin dashboards can be added later.

---

# 15. Future UI Improvements

Possible enhancements:

- merchant dashboard
- fraud alerts dashboard
- analytics charts
- settlement tracking
- payment gateway integration screen

---

# 16. Example Navigation Flow


Login
↓
Dashboard
↓
Make Payment
↓
Select Method
↓
Enter Amount
↓
Transaction Created
↓
View in Transaction History


---

# 17. UI Design Principles

Design follows fintech UI patterns:

- clean dashboard layout
- card-based design
- clear financial data display
- minimal distractions
- fast navigation

---

# 18. Folder Structure

Example frontend structure:


frontend/

│
├── pages/
│ ├── login.html
│ ├── dashboard.html
│ ├── make-payment.html
│ ├── transactions.html
│ ├── my-methods.html
│ └── add-method.html
│
├── css/
│ ├── styles.css
│
├── js/
│ ├── dashboard.js
│ ├── payments.js
│ └── charts.js
│
└── assets/
├── icons
├── logos


---

# 19. Key UI Features

✔ Dashboard analytics  
✔ Payment simulation UI  
✔ Payment method management  
✔ Transaction tracking  
✔ Dark mode  
✔ Modern fintech design  

---

# End of Document