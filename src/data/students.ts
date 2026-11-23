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
];

export const TICKET_PRICE = 3.0; // S/. 3.00 por rifa
export const TARGET_PER_PROMO = 150; // 150 rifas por código

// Base de datos inicial de estudiantes (incluyendo códigos de ejemplo para cada base)
export const INITIAL_STUDENTS: Student[] = [
  // Código 24-1
  { studentCode: '20241001A', fullName: 'Renato Silva Torres', promoCode: '24-1', isDelegate: true },
  { studentCode: '20241002B', fullName: 'Camila Morales Rivas', promoCode: '24-1' },
  { studentCode: '20241003C', fullName: 'Mateo Quispe Flores', promoCode: '24-1' },

  // Base 21
  { studentCode: '20210001K', fullName: 'Rodrigo Mendoza Soto', promoCode: '21', isDelegate: true },
  { studentCode: '20210002F', fullName: 'Luciana Paredes Vega', promoCode: '21' },

  // Base 22-1
  { studentCode: '20220101D', fullName: 'Carlos Fuentes Ramos', promoCode: '22-1', isDelegate: true },
  { studentCode: '20220102E', fullName: 'Valeria Castro Ruiz', promoCode: '22-1' },

  // Base 22-2
  { studentCode: '20222001A', fullName: 'Diego Chávez Alva', promoCode: '22-2', isDelegate: true },
  { studentCode: '20222002B', fullName: 'Andrea Salazar Paz', promoCode: '22-2' },

  // Base 23-1
  { studentCode: '20231001J', fullName: 'Joaquín Herrera Solís', promoCode: '23-1', isDelegate: true },
  { studentCode: '20231002K', fullName: 'María Fernanda Cruz', promoCode: '23-1' },

  // Base 23-2
  { studentCode: '20232001M', fullName: 'Sebastián Romero Díaz', promoCode: '23-2', isDelegate: true },
  { studentCode: '20232002N', fullName: 'Daniela Núñez Prado', promoCode: '23-2' },

  // Código 24-2
  { studentCode: '20244517G', fullName: 'Leonel Cruzado Vega', promoCode: '24-2' },
  { studentCode: '20242001T', fullName: 'Gabriel Ortiz Luna', promoCode: '24-2', isDelegate: true },
  { studentCode: '20242002U', fullName: 'Fiorella Beltrán Soto', promoCode: '24-2' },

  // Base 25-1
  { studentCode: '20251001A', fullName: 'Alejandro Vargas Rey', promoCode: '25-1', isDelegate: true },
  { studentCode: '20251002B', fullName: 'Sofía Gutiérrez Ramos', promoCode: '25-1' },

  // Base 25-2
  { studentCode: '20252001C', fullName: 'Ignacio Cárdenas Silva', promoCode: '25-2', isDelegate: true },
  { studentCode: '20252002D', fullName: 'Patricia Lozano Vera', promoCode: '25-2' },

  // Base 26-1
  { studentCode: '20261001E', fullName: 'Nicolás Rojas Ponce', promoCode: '26-1', isDelegate: true },
  { studentCode: '20261002F', fullName: 'Ariana Benítez Marín', promoCode: '26-1' },

  // Base 26-2
  { studentCode: '20262001G', fullName: 'Thiago Medina Navarro', promoCode: '26-2', isDelegate: true },
  { studentCode: '20262002H', fullName: 'Ximena Peña Castro', promoCode: '26-2' },
];
