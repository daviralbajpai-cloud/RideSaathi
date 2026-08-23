export const defaultGuestUser = {
  id: null,
  email: '',
  name: '',
  phone: '',
  photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  isAdmin: false,
  isAuthenticated: false,
  isSetupComplete: false
};

export const initialUser = {
  name: "Rahul Sharma",
  phone: "+91 98765 43210",
  photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  isAuthenticated: true,
  isSetupComplete: true
};

export const initialRides = [
  {
    id: "ride-1",
    personName: "Priya Patel",
    personPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    from: "Hazratganj",
    to: "Gomti Nagar",
    date: "2026-08-25",
    departureTime: "08:30 AM",
    availableSeats: 3,
    note: "Clean EV car, AC on, happy to share music!",
    preferences: ["AC Required", "No Smoking", "Women Preferred"]
  },
  {
    id: "ride-2",
    personName: "Amit Sharma",
    personPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    from: "Lucknow Junction",
    to: "Kanpur Central",
    date: "2026-08-25",
    departureTime: "09:00 AM",
    availableSeats: 2,
    note: "Daily office trip to Kanpur. Punctual departure.",
    preferences: ["No Smoking"]
  },
  {
    id: "ride-3",
    personName: "Sneha Verma",
    personPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    from: "Indira Nagar",
    to: "Alambagh",
    date: "2026-08-26",
    departureTime: "10:15 AM",
    availableSeats: 4,
    note: "Spacious boot for light luggage. Safe driving.",
    preferences: ["AC Required", "Women Only", "No Smoking"]
  },
  {
    id: "ride-4",
    personName: "Vikram Singh",
    personPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    from: "Charbagh",
    to: "Jankipuram",
    date: "2026-08-26",
    departureTime: "06:00 PM",
    availableSeats: 3,
    note: "Evening commute after work. Drop along Ring Road.",
    preferences: ["AC Required"]
  }
];

export const initialNotifications = [
  {
    id: "notif-1",
    title: "Ride Request Accepted",
    message: "Priya Patel accepted your request to join the ride from Hazratganj to Gomti Nagar.",
    time: "10 mins ago",
    type: "success",
    read: false
  },
  {
    id: "notif-2",
    title: "Route Overlap Detected",
    message: "Your route matches Amit Sharma's travel path from Lucknow to Kanpur.",
    time: "1 hour ago",
    type: "info",
    read: false
  },
  {
    id: "notif-3",
    title: "Upcoming Ride Reminder",
    message: "Your ride with Sneha Verma is scheduled for tomorrow at 10:15 AM.",
    time: "3 hours ago",
    type: "reminder",
    read: true
  },
  {
    id: "notif-4",
    title: "New Ride Request Received",
    message: "Rahul wants to join your ride from Hazratganj to Gomti Nagar with 2 additional people.",
    time: "Yesterday",
    type: "request",
    read: true
  }
];

export const initialActivity = {
  upcoming: [
    {
      id: "act-1",
      personOffering: "Priya Patel",
      personPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      personPhone: "+91 98765 11111",
      from: "Hazratganj",
      to: "Gomti Nagar",
      date: "2026-08-16",
      time: "08:30 AM",
      seatsRequested: 3,
      status: "Confirmed"
    }
  ],
  requests: [
    {
      id: "act-2",
      personRequesting: "Rahul Sharma",
      personPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      from: "Hazratganj",
      to: "Gomti Nagar",
      date: "2026-08-16",
      time: "08:30 AM",
      seatsRequested: 3,
      additionalPeopleCount: 2,
      status: "Pending Request"
    }
  ],
  offered: [
    {
      id: "act-3",
      personOffering: "You (Rahul)",
      personPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      from: "Alambagh",
      to: "Hazratganj",
      date: "2026-08-18",
      time: "09:00 AM",
      availableSeats: 3,
      status: "Active Offer"
    }
  ],
  completed: [
    {
      id: "act-4",
      personOffering: "Amit Sharma",
      personPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      from: "Lucknow",
      to: "Kanpur",
      date: "2026-08-10",
      time: "09:00 AM",
      seatsRequested: 1,
      status: "Completed"
    }
  ],
  cancelled: [
    {
      id: "act-5",
      personOffering: "Vikram Singh",
      personPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      from: "Charbagh",
      to: "Jankipuram",
      date: "2026-08-05",
      time: "06:00 PM",
      seatsRequested: 2,
      status: "Cancelled"
    }
  ]
};

export const initialRecurringRides = [
  {
    id: "rec-1",
    from: "Hazratganj",
    to: "Gomti Nagar IT Park",
    departureTime: "08:30 AM",
    availableSeats: 3,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    status: "Active"
  }
];
