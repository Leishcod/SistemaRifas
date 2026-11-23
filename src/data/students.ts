import type { PromoCode, Student } from '../types';

export const PROMO_CODES: PromoCode[] = [
  '21',
  '22-1',
  '22-2',
  '23-1',
  '23-2',
  '24-1',
  '24-2',
  '25-1',
  '25-2',
  '26-1',
  '26-2',
  'CEIIS',
];

export const TICKET_PRICE = 3.0; // S/. 3.00 por rifa
export const TARGET_PER_PROMO = 150; // 150 rifas por código

// Base de datos de estudiantes
export const INITIAL_STUDENTS: Student[] = [
  { studentCode: '20244517G', fullName: 'Leonel Adriano Cruzado Vega', promoCode: '24-2', isDelegate: false },
];
