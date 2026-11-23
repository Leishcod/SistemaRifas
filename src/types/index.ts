export type PromoCode = 
  | '21' 
  | '22-2' 
  | '23-1' 
  | '23-2' 
  | '24-1' 
  | '24-2' 
  | '25-1' 
  | '25-2' 
  | '26-1' 
  | '26-2'
  | 'CEIIS';

export type UserRole = 'ninguno' | 'delegado' | 'ceiis';

export interface Student {
  studentCode: string; // e.g. "20244517G"
  fullName: string;
  promoCode: PromoCode;
  email?: string;
  role: UserRole;
  password?: string;
}

export interface SessionUser {
  studentCode: string;
  fullName: string;
  promoCode: PromoCode;
  role: UserRole;
}

export type SaleStatus = 'pending' | 'verified' | 'rejected';

export interface Sale {
  id: string;
  ticketNumbers: number[];
  buyerName: string;
  buyerPhone: string;
  sellerStudentCode: string;
  sellerName: string;
  promoCode: PromoCode;
  ticketsCount: number;
  unitPrice: number;
  totalAmount: number;
  voucherImage: string; // Base64 data URL or remote URL
  voucherFileName?: string;
  notes?: string;
  status: SaleStatus;
  createdAt: string;
}

export interface PromoStats {
  promoCode: PromoCode;
  targetTickets: number; // default 150
  soldTickets: number;
  totalAmount: number;
  verifiedTickets: number;
  pendingTickets: number;
  sellersCount: number;
}
