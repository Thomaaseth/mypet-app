const cookies = {
  banner: {
    description:
      'We use cookies to keep you signed in. We\u2019d also like to use analytics cookies to understand how the app is used \u2014 only with your permission.',
    acceptAll: 'Accept all',
    rejectNonEssential: 'Reject non-essential',
    managePreferences: 'Manage preferences',
  },
  dialog: {
    title: 'Cookie preferences',
    description: 'Choose which cookies you\u2019re comfortable with. You can change this at any time.',
    necessary: {
      label: 'Strictly necessary',
      description: 'Required to keep you signed in. Cannot be disabled.',
    },
    analytics: {
      label: 'Analytics',
      description: 'Helps us understand how the app is used. We don\u2019t use this today, but you can opt in ahead of time.',
    },
    save: 'Save preferences',
  },
} as const;

export default cookies;