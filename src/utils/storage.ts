import type { PromoCode, Sale, Student, PromoStats, SaleStatus } from '../types';
import { INITIAL_STUDENTS, PROMO_CODES, TARGET_PER_PROMO, TICKET_PRICE } from '../data/students';
import { supabase } from '../lib/supabase';

const STUDENTS_STORAGE_KEY = 'ceiis_rifas_students_v3';
const SALES_STORAGE_KEY = 'ceiis_rifas_sales_v2';

// ---------------------------------------------------------------------------
// Helpers para mapear datos entre Supabase (snake_case) y TypeScript (camelCase)
// ---------------------------------------------------------------------------
function mapDbToSale(row: any): Sale {
  return {
    id: row.id,
    ticketNumbers: row.ticket_numbers || [],
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    sellerStudentCode: row.seller_student_code,
    sellerName: row.seller_name,
    promoCode: row.promo_code as PromoCode,
    ticketsCount: row.tickets_count,
    unitPrice: Number(row.total_amount) / (row.tickets_count || 1),
    totalAmount: Number(row.total_amount),
    voucherImage: row.voucher_url,
    notes: row.notes || undefined,
    status: (row.status || 'pending') as SaleStatus,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Subida de imagen de Voucher al bucket de Supabase Storage
// ---------------------------------------------------------------------------
export async function uploadVoucherImage(base64Data: string, fileName?: string): Promise<string> {
  try {
    // Si ya es una URL pública (ej. de supabase), devolverla directo
    if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
      return base64Data;
    }

    // Convertir Base64 dataURL a Blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    const filePath = `voucher_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('vouchers')
      .upload(filePath, blob, { contentType: blob.type, upsert: true });

    if (uploadError) {
      console.warn('Error subiendo a Supabase Storage, usando dataURL local:', uploadError);
      return base64Data;
    }

    const { data: publicData } = supabase.storage.from('vouchers').getPublicUrl(filePath);
    return publicData.publicUrl;
  } catch (err) {
    console.error('Error procesando imagen para Supabase:', err);
    return base64Data;
  }
}

// ---------------------------------------------------------------------------
// Estudiantes
// ---------------------------------------------------------------------------
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

export async function fetchStudentsFromSupabase(): Promise<Student[]> {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (!error && data && data.length > 0) {
      const list: Student[] = data.map((d: any) => ({
        studentCode: d.student_code,
        fullName: d.full_name,
        promoCode: d.promo_code as PromoCode,
        isDelegate: d.is_delegate,
      }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(list));
      }
      return list;
    }
  } catch (err) {
    console.warn('No se pudo conectar a Supabase students, usando cache:', err);
  }
  return getStudents();
}

export function findStudentByCode(studentCode: string): Student | undefined {
  const code = studentCode.trim().toUpperCase();
  const students = getStudents();
  return students.find((s) => s.studentCode.toUpperCase() === code);
}

// ---------------------------------------------------------------------------
// Ventas (Sales)
// ---------------------------------------------------------------------------
export function getSales(): Sale[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SALES_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSales(sales: Sale[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  }
}

export async function fetchSalesFromSupabase(): Promise<Sale[]> {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map(mapDbToSale);
      saveSales(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Supabase offline o error de red, usando memoria local:', err);
  }
  return getSales();
}

export function getNextTicketNumbers(count: number): number[] {
  const sales = getSales();
  const allAssigned = new Set(sales.flatMap((s) => s.ticketNumbers));
  const newNumbers: number[] = [];

  let candidate = 1; // Numeración oficial del 1 al n
  while (newNumbers.length < count) {
    if (!allAssigned.has(candidate)) {
      newNumbers.push(candidate);
      allAssigned.add(candidate);
    }
    candidate++;
  }
  return newNumbers;
}

export async function createSaleAsync(data: {
  buyerName: string;
  buyerPhone: string;
  sellerStudentCode: string;
  sellerName: string;
  promoCode: PromoCode;
  ticketsCount: number;
  voucherImage: string;
  voucherFileName?: string;
  notes?: string;
}): Promise<Sale> {
  // Asegurar que tengamos las ventas más recientes para no colisionar con números de boletos
  await fetchSalesFromSupabase();

  const ticketNumbers = getNextTicketNumbers(data.ticketsCount);
  const totalAmount = data.ticketsCount * TICKET_PRICE;
  const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Subir la imagen a Supabase Storage
  const finalVoucherUrl = await uploadVoucherImage(data.voucherImage, data.voucherFileName);

  const newSale: Sale = {
    id: saleId,
    ticketNumbers,
    buyerName: data.buyerName.trim(),
    buyerPhone: data.buyerPhone.trim().replace(/\D/g, ''),
    sellerStudentCode: data.sellerStudentCode.trim().toUpperCase(),
    sellerName: data.sellerName.trim(),
    promoCode: data.promoCode,
    ticketsCount: data.ticketsCount,
    unitPrice: TICKET_PRICE,
    totalAmount,
    voucherImage: finalVoucherUrl,
    voucherFileName: data.voucherFileName,
    notes: data.notes?.trim() || undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Guardar en Supabase PostgreSQL
  try {
    const { error } = await supabase.from('sales').insert({
      id: newSale.id,
      buyer_name: newSale.buyerName,
      buyer_phone: newSale.buyerPhone,
      seller_student_code: newSale.sellerStudentCode,
      seller_name: newSale.sellerName,
      promo_code: newSale.promoCode,
      tickets_count: newSale.ticketsCount,
      ticket_numbers: newSale.ticketNumbers,
      total_amount: newSale.totalAmount,
      voucher_url: finalVoucherUrl,
      notes: newSale.notes || null,
      status: 'pending',
      created_at: newSale.createdAt,
    });

    if (error) {
      console.error('Error insertando en Supabase:', error);
    }
  } catch (err) {
    console.error('Fallo de red en insert de Supabase:', err);
  }

  // Guardar en caché local
  const currentSales = getSales();
  currentSales.unshift(newSale);
  saveSales(currentSales);

  return newSale;
}

export async function updateSaleStatusAsync(saleId: string, status: SaleStatus): Promise<boolean> {
  // Actualizar en Supabase
  try {
    await supabase.from('sales').update({ status }).eq('id', saleId);
  } catch (err) {
    console.error('Error actualizando status en Supabase:', err);
  }

  // Actualizar en caché local
  const sales = getSales();
  const index = sales.findIndex((s) => s.id === saleId);
  if (index !== -1) {
    sales[index].status = status;
    saveSales(sales);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Estadísticas para Ranking / Leaderboard
// ---------------------------------------------------------------------------
export function computePromoStats(sales: Sale[]): PromoStats[] {
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

export function getPromoStats(): PromoStats[] {
  return computePromoStats(getSales());
}

// ---------------------------------------------------------------------------
// Generación de Enlace WhatsApp
// ---------------------------------------------------------------------------
export function generateWhatsAppLink(sale: Sale, originUrl?: string): string {
  const phone = sale.buyerPhone.startsWith('51') ? sale.buyerPhone : `51${sale.buyerPhone}`;
  const ticketsList = sale.ticketNumbers.map((n) => `🎟️ *N°${n}*`).join(', ');
  const host = originUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const ticketViewUrl = `${host}/consultar?id=${sale.id}`;

  const message = `*¡HOLA ${sale.buyerName.toUpperCase()}!*\n` +
    `Muchas gracias por colaborar con la *GRAN RIFA FIIS 2026* organizada por el *CEIIS - UNI* 💙🚀\n\n` +
    `Tus boletos virtuales han sido registrados oficialmente:\n` +
    `${ticketsList}\n\n` +
    `👤 *Comprador(a):* ${sale.buyerName}\n` +
    `🎓 *Vendedor(a):* ${sale.sellerName} (${sale.promoCode === 'CEIIS' ? 'CEIIS' : `Código ${sale.promoCode}`})\n` +
    `💰 *Monto abonado:* S/. ${sale.totalAmount.toFixed(2)} (Plin)\n\n` +
    `Puedes visualizar y validar tu boleto oficial en cualquier momento aquí:\n` +
    `👉 ${ticketViewUrl}\n\n` +
    `¡Mucha suerte en el sorteo! 🎉`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
