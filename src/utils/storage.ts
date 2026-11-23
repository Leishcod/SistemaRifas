import type { PromoCode, Sale, Student, PromoStats, SaleStatus } from '../types';
import { INITIAL_STUDENTS, PROMO_CODES, TARGET_PER_PROMO, TICKET_PRICE } from '../data/students';

const STUDENTS_STORAGE_KEY = 'ceiis_rifas_students_v3';
const SALES_STORAGE_KEY = 'ceiis_rifas_sales_v2';

// Ventas iniciales en 0 para inicio limpio de la campaña oficial
const INITIAL_SALES: Sale[] = [];

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

  const message = `*¡HOLA ${sale.buyerName.toUpperCase()}!*\n` +
    `Muchas gracias por participar y apoyar al código *${sale.promoCode}* en la Gran Rifa FIIS 2026.\n\n` +
    `📋 *Detalles de tu compra:*\n` +
    `• Vendedor(a): ${sale.sellerName} (${sale.sellerStudentCode})\n` +
    `• Cantidad: ${sale.ticketsCount} rifa(s)\n` +
    `• Total abonado: S/. ${sale.totalAmount.toFixed(2)}\n` +
    `• Tus boletos oficiales asignados:\n${ticketsList}\n\n` +
    `🎫 *Puedes visualizar y descargar tu boleto digital oficial aquí:*\n${ticketViewUrl}\n\n` +
    `¡Mucha suerte en el sorteo! 🍀✨`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
