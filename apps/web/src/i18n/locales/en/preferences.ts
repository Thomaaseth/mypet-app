const preferences = {
  dateFormat: {
      DMY: {
        label: 'Day / Month',
        description: 'DD/MM/YYYY',
      },
      MDY: {
        label: 'Month / Day',
        description: 'MM/DD/YYYY',
      },
    },
    timeFormat: {
      '24h': {
        label: '24-hour',
        description: '14:30',
      },
      '12h': {
        label: '12-hour',
        description: '2:30 PM',
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