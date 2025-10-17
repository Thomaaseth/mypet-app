// 'use client';

// import { Loader2 } from 'lucide-react';
// import ResetPasswordForm from '@/components/ui/auth/ResetPasswordForm';
// import { useTokenValidation } from '@/hooks/useTokenValidation'; // New hook!

// export default function ResetPasswordPage() {
//   // Single hook manages all token validation logic
//   const { token, isValidating, isValid } = useTokenValidation({
//     paramName: 'token',
//     redirectOnInvalid: '/forgot-password',
//     required: true
//   });

//   // Simple loading state
//   if (isValidating) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-center">
//           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//           Validating reset link...
//         </div>
//       </div>
//     );
//   }

//   // Simple validation check - redirect logic is handled in the hook
//   if (!isValid || !token) {
//     return null; // Hook handles redirect
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <ResetPasswordForm token={token} />
//     </div>
//   );
// }