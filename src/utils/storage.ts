import type { PromoCode, Sale, Student, PromoStats, SaleStatus } from '../types';
import { INITIAL_STUDENTS, PROMO_CODES, TARGET_PER_PROMO, TICKET_PRICE } from '../data/students';

const STUDENTS_STORAGE_KEY = 'ceiis_rifas_students';
const SALES_STORAGE_KEY = 'ceiis_rifas_sales';

// Ventas iniciales de muestra para que el sistema tenga métricas en vivo inmediatamente
const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-001',
    ticketNumbers: [1001, 1002],
    buyerName: 'Carlos Mendoza Silva',
    buyerPhone: '987654321',
    sellerStudentCode: '20244517G',
    sellerName: 'Leonel Cruzado Vega',
    promoCode: '24-1',
    ticketsCount: 2,
    unitPrice: TICKET_PRICE,
    totalAmount: 10.0,
    voucherImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    operationNumber: 'OP-492817',
    status: 'verified',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'sale-002',
    ticketNumbers: [1003],
    buyerName: 'Fernanda Ríos Prado',
    buyerPhone: '912345678',
    sellerStudentCode: '20244517G',
    sellerName: 'Leonel Cruzado Vega',
    promoCode: '24-1',
    ticketsCount: 1,
    unitPrice: TICKET_PRICE,
    totalAmount: 5.0,
    voucherImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    operationNumber: 'OP-492992',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sale-003',
    ticketNumbers: [1004, 1005, 1006],
    buyerName: 'Jorge Castillo Vega',
    buyerPhone: '955443322',
    sellerStudentCode: '20231001J',
    sellerName: 'Joaquín Herrera Solís',
    promoCode: '23-1',
    ticketsCount: 3,
    unitPrice: TICKET_PRICE,
    totalAmount: 15.0,
    voucherImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    operationNumber: 'OP-510023',
    status: 'verified',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'sale-004',
    ticketNumbers: [1007, 1008],
    buyerName: 'Lucía Torres Benítez',
    buyerPhone: '944887711',
    sellerStudentCode: '20251001A',
    sellerName: 'Alejandro Vargas Rey',
    promoCode: '25-1',
    ticketsCount: 2,
    unitPrice: TICKET_PRICE,
    totalAmount: 10.0,
    voucherImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    operationNumber: 'OP-619283',
    status: 'verified',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'sale-005',
    ticketNumbers: [1009],
    buyerName: 'Raúl Medina Castro',
    buyerPhone: '933221100',
    sellerStudentCode: '20222001A',
    sellerName: 'Diego Chávez Alva',
    promoCode: '22-2',
    ticketsCount: 1,
    unitPrice: TICKET_PRICE,
    totalAmount: 5.0,
    voucherImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  }
];

export function getStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  }
}

export function findStudentByCode(studentCode: string): Student | undefined {
  const code = studentCode.trim().toUpperCase();
  const students = getStudents();
  return students.find((s) => s.studentCode.toUpperCase() === code);
}

export function getSales(): Sale[] {
  if (typeof window === 'undefined') return INITIAL_SALES;
  const stored = localStorage.getItem(SALES_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SALES;
  }
}

export function saveSales(sales: Sale[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  }
}

export function getNextTicketNumbers(count: number): number[] {
  const sales = getSales();
  const allAssigned = new Set(sales.flatMap((s) => s.ticketNumbers));
  const newNumbers: number[] = [];

  let candidate = 1001; // Empezamos numeración en 1001 (hasta 3000)
  while (newNumbers.length < count) {
    if (!allAssigned.has(candidate)) {
      newNumbers.push(candidate);
      allAssigned.add(candidate);
    }
    candidate++;
  }
  return newNumbers;
}

export function createSale(data: {
  buyerName: string;
  buyerPhone: string;
  sellerStudentCode: string;
  sellerName: string;
  promoCode: PromoCode;
  ticketsCount: number;
  voucherImage: string;
  voucherFileName?: string;
  operationNumber?: string;
  notes?: string;
}): Sale {
  const currentSales = getSales();
  const ticketNumbers = getNextTicketNumbers(data.ticketsCount);
  const totalAmount = data.ticketsCount * TICKET_PRICE;

  const newSale: Sale = {
    id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketNumbers,
    buyerName: data.buyerName.trim(),
    buyerPhone: data.buyerPhone.trim().replace(/\D/g, ''),
    sellerStudentCode: data.sellerStudentCode.trim().toUpperCase(),
    sellerName: data.sellerName.trim(),
    promoCode: data.promoCode,
    ticketsCount: data.ticketsCount,
    unitPrice: TICKET_PRICE,
    totalAmount,
    voucherImage: data.voucherImage,
    voucherFileName: data.voucherFileName,
    operationNumber: data.operationNumber?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  currentSales.unshift(newSale);
  saveSales(currentSales);
  return newSale;
}

export function updateSaleStatus(saleId: string, status: SaleStatus): boolean {
  const sales = getSales();
  const index = sales.findIndex((s) => s.id === saleId);
  if (index === -1) return false;

  sales[index].status = status;
  saveSales(sales);
  return true;
}

export function getPromoStats(): PromoStats[] {
  const sales = getSales();

  return PROMO_CODES.map((promo) => {
    const promoSales = sales.filter((s) => s.promoCode === promo);
    const soldTickets = promoSales.reduce((acc, s) => acc + s.ticketsCount, 0);
    const totalAmount = promoSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const verifiedTickets = promoSales
      .filter((s) => s.status === 'verified')
      .reduce((acc, s) => acc + s.ticketsCount, 0);
    const pendingTickets = promoSales
      .filter((s) => s.status === 'pending')
      .reduce((acc, s) => acc + s.ticketsCount, 0);

    const sellersCount = new Set(promoSales.map((s) => s.sellerStudentCode)).size;

    return {
      promoCode: promo,
      targetTickets: TARGET_PER_PROMO,
      soldTickets,
      totalAmount,
      verifiedTickets,
      pendingTickets,
      sellersCount,
    };
  });
}

export function generateWhatsAppLink(sale: Sale, originUrl?: string): string {
  const phone = sale.buyerPhone.startsWith('51') ? sale.buyerPhone : `51${sale.buyerPhone}`;
  const ticketsList = sale.ticketNumbers.map((n) => `🎟️ *N° ${String(n).padStart(4, '0')}*`).join(', ');
  const host = originUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const ticketViewUrl = `${host}/consultar?id=${sale.id}`;

  const message = `🎉 *¡HOLA ${sale.buyerName.toUpperCase()}!* 🎉\n` +
    `Muchas gracias por participar y apoyar a la base *${sale.promoCode}* en la Gran Rifa FIIS 2026 🏛️.\n\n` +
    `📋 *Detalles de tu compra:*\n` +
    `• Vendedor(a): ${sale.sellerName} (${sale.sellerStudentCode})\n` +
    `• Cantidad: ${sale.ticketsCount} rifa(s)\n` +
    `• Total abonado: S/. ${sale.totalAmount.toFixed(2)}\n` +
    `• Tus boletos oficiales asignados:\n${ticketsList}\n\n` +
    `🎫 *Puedes visualizar y descargar tu boleto digital oficial aquí:*\n${ticketViewUrl}\n\n` +
    `¡Mucha suerte en el sorteo! 🍀✨`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
