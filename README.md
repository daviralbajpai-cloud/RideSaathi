# 🚗 RideSaathi

### Serving Those Who Serve the Nation 🇮🇳

RideSaathi is a **mobile-first carpooling platform** designed to help people connect through shared rides. The platform focuses on making everyday travel more convenient, affordable, and community-driven by allowing users to **offer rides or request available rides**.

> **RideSaathi is an independent community platform and is not affiliated with, endorsed by, or officially connected to the Indian Army or the Government of India.**

---

## 📱 Live Project

🌐 **Live Website:** Add your Vercel URL here

💻 **GitHub Repository:** Add your GitHub repository URL here

---

## ✨ Features

### 🔐 Authentication

* Google authentication
* Secure user sessions using Supabase Auth
* Separate admin authentication
* Protected application routes

### 👤 User Profiles

* Name
* Phone number
* Profile photo
* Profile management
* Mandatory phone number before participating in rides

### 🚘 Offer a Ride

Users can offer available seats in their vehicle by providing:

* Starting location
* Destination
* Date
* Departure time
* Available seats
* Additional ride information

### 🔎 Find a Ride

Users can search for available rides using:

* From location
* Destination
* Date
* Departure time
* Number of seats

The application also provides **location autocomplete and suggestions** to reduce problems caused by misspelled locations.

### 🤝 Ride Requests

* Request seats on an available ride
* Ride owner receives a notification
* Ride owner can accept or decline requests
* Seat availability is checked securely
* Prevents overbooking

### 📞 Contact Exchange

For privacy and security:

* Phone numbers are **not publicly displayed**
* Phone numbers are not revealed while a request is pending
* After a ride request is accepted, both participants can see each other's phone number
* A **Call** button opens the device's native dialer

### 🔔 Notifications

Users receive notifications for important ride events such as:

* Ride requests
* Accepted requests
* Declined requests
* Ride-related updates

### 📅 Recurring Rides

Users can save recurring ride schedules for regular journeys.

### 🕒 Activity

Users can view:

* Upcoming rides
* Ride requests
* Rides they offered
* Completed rides
* Cancelled rides

### 🛡️ Security

RideSaathi uses Supabase Row Level Security and secure database functions to protect user data.

The application includes:

* Row Level Security (RLS)
* Secure PostgreSQL functions
* Protected profile information
* Restricted phone-number access
* Secure ride-request processing
* Protected administrative permissions

---

## 🏗️ Tech Stack

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| **React**             | Frontend framework             |
| **Vite**              | Development & production build |
| **Tailwind CSS**      | UI styling                     |
| **React Router**      | Application routing            |
| **Supabase**          | Backend platform               |
| **PostgreSQL**        | Database                       |
| **Supabase Auth**     | Authentication                 |
| **Supabase Realtime** | Real-time updates              |
| **Vercel**            | Deployment                     |

---

## 📂 Project Structure

```text
RideSaathi/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── mock/
│   ├── pages/
│   └── services/
│
├── supabase/
│   ├── migrations/
│   └── schema.sql
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/RideSaathi.git
```

### 2. Enter the project directory

```bash
cd RideSaathi
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> **Never commit your `.env` file or private API keys to GitHub.**

### 5. Start the development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

### 6. Create a production build

```bash
npm run build
```

---

## 🗄️ Database

RideSaathi uses **Supabase PostgreSQL**.

The database contains functionality for:

* User profiles
* Rides
* Ride requests
* Notifications
* Recurring rides
* Secure contact exchange
* Administrative permissions

Database configuration and SQL changes are maintained inside:

```text
supabase/
```

---

## 🔒 Privacy & Security

RideSaathi follows a privacy-first approach for user contact information.

### Phone numbers

Phone numbers are:

* Required before offering or requesting a ride
* Not exposed during ride searching
* Not exposed to unrelated users
* Shared only between confirmed ride participants

### Row Level Security

Supabase RLS policies restrict users from accessing information belonging to other users unless the application explicitly allows it.

### Administrative Access

Administrative access is permission-based.

Normal users cannot:

* Register themselves as administrators
* Change their own administrative privileges
* Access the admin dashboard without authorization

---

## 🧭 How RideSaathi Works

```text
User
 │
 ├── Create Profile
 │
 ├── Add Phone Number
 │
 ├── Offer a Ride ──────────────┐
 │                              │
 │                              ▼
 │                         Available Ride
 │                              ▲
 │                              │
 └── Find a Ride ───────────────┘
                                │
                                ▼
                         Request to Join
                                │
                                ▼
                         Ride Owner
                         Accept / Decline
                                │
                         ┌──────┴──────┐
                         │             │
                      Declined      Accepted
                                       │
                                       ▼
                              Contact Information
                              Shared Privately
                                       │
                                       ▼
                                  📞 Call
```

---

## 🎯 Project Goals

RideSaathi was built with the following goals:

* Make shared transportation easier
* Reduce unnecessary empty seats
* Connect people travelling on similar routes
* Provide a simple mobile-first experience
* Protect users' personal contact information
* Create a trustworthy community-based ride-sharing experience

---

## 🛣️ Future Improvements

Potential future improvements include:

* In-app messaging
* Better ride matching
* Advanced route matching
* Ride reminders
* User reporting and blocking
* Improved safety features
* More advanced recurring rides
* Progressive Web App (PWA) support
* Native Android/iOS application

---

## 🧑‍💻 Development

RideSaathi was developed as a full-stack web application using modern frontend and backend technologies.

The project focuses on:

* Component-based React development
* Secure database architecture
* Authentication
* RLS policies
* PostgreSQL functions
* Responsive mobile-first UI
* Production deployment

---

## ⚠️ Disclaimer

RideSaathi is a **technology platform for connecting users who may wish to share rides**.

RideSaathi does not itself provide transportation services, operate vehicles, employ drivers, or guarantee the conduct of users.

Users are responsible for complying with applicable laws and ensuring that they have the necessary driving licence, vehicle documents, insurance, permissions, and other requirements applicable to their journey.

RideSaathi is an independent project and **does not represent, operate on behalf of, or claim endorsement from the Indian Army, Ministry of Defence, or Government of India.**

---

## 📄 License

This project currently does not include an open-source license.

Unless a license is added to this repository, the source code should not be assumed to be freely reusable or redistributable.

---

## 🇮🇳 RideSaathi

**Serving Those Who Serve the Nation.**

Built to make everyday journeys simpler through community and shared mobility.
