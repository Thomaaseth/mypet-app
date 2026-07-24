const preferences = {
    dateTimeLocale: {
      frFR: {
        label: '24-hour',
        description: 'DD/MM/YYYY · 24h clock',
      },
      enUS: {
        label: '12-hour',
        description: 'MM/DD/YYYY · 12h clock',
      },
    },
    unitSystem: {
      metric: {
        label: 'Metric',
        description: 'kg · grams',
      },
      imperial: {
        label: 'Imperial',
        description: 'lbs · oz',
      },
    },
    banner: {
      description: 'Choose your preferred date/time format and units to get started. You can change these options at any time in your profile.',
      saving: 'Saving...',
    },
  } as const;
  
  export default preferences;