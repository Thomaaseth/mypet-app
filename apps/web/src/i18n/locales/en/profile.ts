const profile = {
    account: {
      title: 'Account Information',
      description: 'Your account details and verification status.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      emailNotVerified: 'Email not verified. Check your inbox for verification email.',
      loadError: 'Failed to load your profile. Please try refreshing the page.',
    },
    preferencesCard: {
      title: 'Date, Time & Units',
      description: 'Choose your preferred date/time format and measurement system.',
    },
    emailForm: {
      title: 'Update Email',
      description: 'Change your account email address.',
      newEmailLabel: 'New Email Address',
      newEmailPlaceholder: 'Enter new email address',
      submitUpdating: 'Updating...',
      submitUpdate: 'Update Email',
    },
    passwordForm: {
      title: 'Change Password',
      description: 'Update your account password for better security.',
      currentPasswordLabel: 'Current Password',
      currentPasswordPlaceholder: 'Enter current password',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Enter new password',
      confirmPasswordLabel: 'Confirm New Password',
      confirmPasswordPlaceholder: 'Confirm new password',
      submitChanging: 'Changing...',
      submitChange: 'Change Password',
    },
  } as const;
  
  export default profile;