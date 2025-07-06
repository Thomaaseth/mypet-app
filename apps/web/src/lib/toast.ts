import { toast } from 'sonner';

export const toastService = {
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 5000,
    });
  },

  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      duration: 6000, // Longer duration for errors so users can read them
    });
  },

  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      duration: 4000,
    });
  },

  emailSent: (message: string = "Email sent!", description?: string) => {
    return toast.success(message, {
      description: description || "Check your inbox and follow the instructions.",
      duration: 5000,
    });
  },

promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
      duration: 4000,
    });
  },

auth: {
    signUpSuccess: () => 
      toastService.emailSent(
        "Account created successfully!",
        "Please check your email to verify your account."
      ),

    signInSuccess: () => 
      toastService.success("Welcome back!"),

    passwordChanged: () => 
      toastService.success("Password changed successfully"),

    emailUpdated: (isVerified: boolean) => 
      isVerified 
        ? toastService.emailSent(
            "Email update initiated",
            "Check your inbox and click the verification link to complete the change."
          )
        : toastService.success("Email updated successfully"),

    verificationSent: () => 
      toastService.emailSent("Verification email sent"),

    passwordResetSent: () => 
      toastService.emailSent(
        "Password reset email sent",
        "Check your inbox for reset instructions."
      ),

    passwordResetSuccess: () => 
      toastService.success(
        "Password reset successfully!",
        "You can now sign in with your new password."
        ),
  },
}

export { toast };