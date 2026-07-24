const common = {
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      loading: 'Loading...',
      tryAgain: 'Try Again',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      network: 'Network error. Please check your connection and try again.',
      genericTitle: 'Something went wrong',
      emailAlreadyInUseTitle: 'Email already in use',
      emailAlreadyInUseDescription: 'Try signing in instead or use a different email',
      invalidCredentialsTitle: 'Invalid credentials',
      invalidCredentialsDescription: 'Please check your email and password',
    },
  } as const;
  
  export default common;