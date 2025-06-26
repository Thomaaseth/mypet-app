export interface User {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  }
  
  export interface Session {
    user: User;
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      token: string;
      createdAt: Date;
      updatedAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
    };
  }