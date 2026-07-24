const notes = {
    widget: {
      title: 'Notes',
      addNote: 'Add note',
      emptyTitle: 'No notes yet',
      emptyDescription: 'Add things you want to remember about your pet.',
      loadError: 'Failed to load notes. Please try again.',
      limitReached: 'Maximum of {{count}} notes reached.',
    },
    charCount: '{{count}}/200 characters',
    addDialog: {
      title: 'Add Note',
      placeholder: 'Type a note...',
      submit: 'Add Note',
    },
    editDialog: {
      title: 'Edit Note',
    },
    deleteDialog: {
      title: 'Delete Note',
      description: 'Are you sure you want to delete this note? This action cannot be undone.',
      deleting: 'Deleting...',
    },
    validation: {
        contentRequired: 'Note cannot be empty',
        contentTooLong: 'Note must be less than 200 characters',
      },
  } as const;
  
  export default notes;