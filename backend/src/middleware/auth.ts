import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Ensure consistent user ID access - use userId from token
    req.user = {
      userId: decoded.userId, // This should match what you put in jwt.sign()
      email: decoded.email
    };
    next();
  });
};

// Add this missing function that server.ts is trying to import
export const verifyToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};