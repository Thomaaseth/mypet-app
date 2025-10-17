// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import { Navbar } from "@/components/Navbar";
// import { Toaster } from "@/components/ui/sonner"
// import { SessionProvider } from "@/contexts/SessionContext";

// import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Pettr",
//   description: "Manage your pets health with ease",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//       <SessionProvider>
//        <Navbar />
//         <main className="min-h-screen">
//         {children}
//         </main>
//         <Toaster position="bottom-right" />
//        </SessionProvider>
//       </body>
//     </html>
//   );
// }
