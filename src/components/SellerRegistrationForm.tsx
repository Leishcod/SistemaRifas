import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { PromoCode, Sale, Student } from '../types';
import { PROMO_CODES, TICKET_PRICE, TARGET_PER_PROMO } from '../data/students';
import { findStudentByCode, createSaleAsync, getSales, fetchStudentsFromSupabase, fetchSalesFromSupabase } from '../utils/storage';
import { VirtualTicketCard } from './VirtualTicketCard';

export const SellerRegistrationForm: React.FC = () => {
  // Step 1: Seller Authentication & Verification (inician vacíos por defecto)
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | ''>('');
  const [studentCodeInput, setStudentCodeInput] = useState<string>('');
  const [authenticatedSeller, setAuthenticatedSeller] = useState<Student | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Step 2: Sale Info
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [ticketsCount, setTicketsCount] = useState<number>(1);
  const [voucherImage, setVoucherImage] = useState<string>('');
  const [voucherFileName, setVoucherFileName] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [sellerSalesCount, setSellerSalesCount] = useState<number>(0);

  // Initialize and check code on mount or when inputs change
  useEffect(() => {
    let initialPromo: PromoCode | '' = selectedPromo;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paramPromo = (urlParams.get('codigo') || urlParams.get('base')) as PromoCode;
      if (paramPromo && PROMO_CODES.includes(paramPromo)) {
        initialPromo = paramPromo;
        setSelectedPromo(paramPromo);
      }
    }
    fetchStudentsFromSupabase().then(() => {
      if (studentCodeInput.trim() && initialPromo) {
        handleVerifyStudent(studentCodeInput, initialPromo, false);
      }
    });
    fetchSalesFromSupabase().then(() => {
      if (studentCodeInput.trim()) {
        updateSellerProgress(studentCodeInput);
      }
    });
  }, []);

  const handleVerifyStudent = (code: string, promo: PromoCode | '', showError = true, autoSelect = false) => {
    setCodeError(null);
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setAuthenticatedSeller(null);
      return;
    }

    const student = findStudentByCode(cleanCode);
    if (!student) {
      if (cleanCode.length >= 8) {
        // Si no está registrado en la base de muestra, permitimos al estudiante registrarse dinámicamente
        let inferredPromo = promo;
        if (!inferredPromo && cleanCode.startsWith('2021')) {
          inferredPromo = '21';
        }
        const dynamicStudent: Student = {
          studentCode: cleanCode,
          fullName: `Estudiante ${cleanCode}`,
          promoCode: (inferredPromo || '24-1') as PromoCode,
          role: 'ninguno',
        };
        setAuthenticatedSeller(dynamicStudent);
        updateSellerProgress(cleanCode);
      } else {
        setAuthenticatedSeller(null);
        if (showError) setCodeError('Ingresa un código universitario válido (ej. 20244517G)');
      }
      return;
    }

    // Regla de Código para Vendedores:
    // 1. Si es miembro CEIIS:
    //    Puede registrar venta a nombre de 'CEIIS' O a nombre de su código de ingreso (student.promoCode).
    //    Si selecciona un código distinto a ambos, se le notifica que seleccione CEIIS o su código de ingreso.
    // 2. Si no es CEIIS (estudiante regular o delegado):
    //    Debe seleccionar obligatoriamente su código de ingreso (student.promoCode).
    const isCeiisMember = student.role === 'ceiis';
    const naturalPromo = student.promoCode; // Su base de ingreso (ej: 23-1, 24-1, 25-2, etc.)

    let currentPromo = promo;
    if (autoSelect) {
      // Si el código actual seleccionado no es válido para este estudiante:
      if (isCeiisMember) {
        if (currentPromo !== 'CEIIS' && currentPromo !== naturalPromo) {
          setSelectedPromo('CEIIS');
          currentPromo = 'CEIIS';
        }
      } else {
        if (currentPromo !== naturalPromo) {
          setSelectedPromo(naturalPromo);
          currentPromo = naturalPromo;
        }
      }
    }

    // Validación de coincidencia:
    if (isCeiisMember) {
      if (currentPromo !== 'CEIIS' && currentPromo !== naturalPromo) {
        setAuthenticatedSeller(null);
        setCodeError(
          naturalPromo !== 'CEIIS'
            ? `Como miembro CEIIS, puedes seleccionar CEIIS o tu Código de ingreso ${naturalPromo}.`
            : `El código ${cleanCode} pertenece al CEIIS. Por favor, selecciona CEIIS.`
        );
        return;
      }
    } else {
      if (currentPromo !== naturalPromo) {
        setAuthenticatedSeller(null);
        setCodeError(
          `El código ${cleanCode} pertenece al Código ${naturalPromo}. Por favor, selecciona tu código correcto.`
        );
        return;
      }
    }

    // Autenticar al vendedor asignándole el código seleccionado (CEIIS o su código de ingreso)
    const effectiveStudent: Student = {
      ...student,
      promoCode: currentPromo,
    };

    setAuthenticatedSeller(effectiveStudent);
    updateSellerProgress(cleanCode);
  };

  const updateSellerProgress = (code: string) => {
    const sales = getSales();
    // Solo contar ventas no rechazadas para el avance del vendedor
    const mySales = sales.filter(
      (s) => s.sellerStudentCode.toUpperCase() === code.toUpperCase() && s.status !== 'rejected'
    );
    const totalSold = mySales.reduce((acc, s) => acc + s.ticketsCount, 0);
    setSellerSalesCount(totalSold);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen (PNG, JPG, JPEG).');
      return;
    }

    // Comprobar tamaño (máximo 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no debe superar los 8MB.');
      return;
    }

    setVoucherFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setVoucherImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedSeller) {
      alert('Primero debes verificar tu código de estudiante.');
      return;
    }

    if (!buyerName.trim()) {
      alert('Por favor ingresa los Nombres y Apellidos del comprador.');
      return;
    }

    const cleanPhone = buyerPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 9 || !cleanPhone.startsWith('9')) {
      alert('Por favor ingresa un número de celular válido de 9 dígitos que empiece con 9.');
      return;
    }

    if (ticketsCount < 1) {
      alert('Debes asignar al menos 1 rifa.');
      return;
    }

    if (!voucherImage) {
      alert('Es obligatorio adjuntar la captura del comprobante de Plin.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newSale = await createSaleAsync({
        buyerName,
        buyerPhone: cleanPhone,
        sellerStudentCode: authenticatedSeller.studentCode,
        sellerName: authenticatedSeller.fullName,
        promoCode: authenticatedSeller.promoCode,
        ticketsCount,
        voucherImage,
        voucherFileName,
        notes,
      });

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#3b82f6', '#10b981', '#ffffff'],
      });

      setCompletedSale(newSale);
      updateSellerProgress(authenticatedSeller.studentCode);
    } catch (err) {
      alert('Hubo un error al procesar el registro. Inténtalo nuevamente.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewSale = () => {
    setCompletedSale(null);
    setBuyerName('');
    setBuyerPhone('');
    setTicketsCount(1);
    setVoucherImage('');
    setVoucherFileName('');
    setNotes('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Step 1: Identity & Base Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-8 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
            1
          </div>
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-white">Identificación del Vendedor</h2>
            <p className="text-xs text-slate-400">Selecciona tu código de ingreso e ingresa tu código de estudiante UNI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
          {/* Promo selector */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Código
            </label>
            <select
              value={selectedPromo}
              onChange={(e) => {
                const newPromo = e.target.value as PromoCode;
                setSelectedPromo(newPromo);
                if (studentCodeInput.trim()) {
                  handleVerifyStudent(studentCodeInput, newPromo, true, false);
                }
              }}
              className="w-full bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            >
              <option value="" disabled className="bg-[#060621] text-slate-500">
                Selecciona código
              </option>
              {PROMO_CODES.map((code) => (
                <option key={code} value={code} className="bg-[#060621] text-white">
                  {code === 'CEIIS' ? 'CEIIS' : `Código ${code}`}
                </option>
              ))}
            </select>
          </div>

          {/* Student code input */}
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tu Código UNI:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={studentCodeInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setStudentCodeInput(val);
                  if (val.length >= 8) {
                    handleVerifyStudent(val, selectedPromo, false, true);
                  } else {
                    setAuthenticatedSeller(null);
                    setCodeError(null);
                  }
                }}
                onBlur={() => {
                  if (studentCodeInput.trim()) {
                    handleVerifyStudent(studentCodeInput, selectedPromo, true, true);
                  }
                }}
                placeholder="Ej. 20244517G"
                maxLength={10}
                className="w-full uppercase font-mono tracking-wider bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => handleVerifyStudent(studentCodeInput, selectedPromo, true, true)}
                className="px-4 py-3 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 border border-cyan-500/30 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] shrink-0"
              >
                Verificar
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status Feedback */}
        {codeError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 shrink-0">Aviso</span>
            <p>{codeError}</p>
          </div>
        )}

        {authenticatedSeller && (
          <div className="mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                OK
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-cyan-400 font-semibold uppercase tracking-wider">Vendedor Identificado</p>
                <p className="font-heading font-bold text-white text-sm sm:text-base truncate">{authenticatedSeller.fullName}</p>
                <p className="text-xs text-slate-300 font-mono whitespace-nowrap">
                  Cód. {authenticatedSeller.studentCode} | {authenticatedSeller.promoCode}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 sm:gap-0.5 bg-black/30 px-3.5 py-2 rounded-xl border border-white/5 shrink-0">
              <span className="text-[11px] text-slate-400">Tus rifas registradas:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-mono font-bold text-cyan-300">{sellerSalesCount}</span>
                <span className="text-[11px] text-slate-400">rifas</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* When sale is already completed, show ticket directly */}
      {completedSale ? (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xs font-bold text-emerald-300 tracking-wider">
              OK
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-white">Venta Registrada Exitosamente</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Se han asignado <strong className="text-cyan-300">{completedSale.ticketsCount} boleto(s)</strong> para{' '}
              <strong className="text-white">{completedSale.buyerName}</strong>. El registro se encuentra en proceso de validación.
            </p>
          </div>

          <VirtualTicketCard sale={completedSale} showShareActions={false} />

          <div className="text-center pt-4">
            <button
              onClick={handleResetForNewSale}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 border border-cyan-500/30 text-white font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all"
            >
              Registrar Otra Venta
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Sale Registration Form */
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-4 sm:p-8 border border-cyan-500/20 shadow-xl space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-white">Datos de la Venta</h2>
              <p className="text-xs text-slate-400">Ingresa la información del comprador y adjunta el comprobante de pago</p>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombres y Apellidos del Comprador: <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value.toUpperCase())}
                placeholder="Ej. ENRIQUE VALDIVIA"
                className="w-full bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder:text-slate-600 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Número de Celular (WhatsApp): <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm text-slate-500 font-mono">+51</span>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => {
                    // Permitir solo dígitos y limitar a exactamente 9 números
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setBuyerPhone(val);
                  }}
                  placeholder="987654321"
                  maxLength={9}
                  className="w-full pl-12 bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Ticket Quantity & Live Total Calculator */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900/40 to-indigo-950/30 border border-cyan-500/25">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                  Cantidad de Rifas a Asignar:
                </label>
                <p className="text-xs text-slate-400">Precio unitario: S/. {TICKET_PRICE.toFixed(2)} por rifa</p>
              </div>

              {/* Counter and Quick Buttons: tamaños compactos para que encajen perfecto en móvil */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl bg-[#030617] border border-cyan-500/40 p-0.5 sm:p-1">
                  <button
                    type="button"
                    onClick={() => setTicketsCount(Math.max(1, ticketsCount - 1))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors active:scale-95 text-xs sm:text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 sm:w-12 text-center font-mono font-bold text-sm sm:text-base text-white">
                    {ticketsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTicketsCount(ticketsCount + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors active:scale-95 text-xs sm:text-sm"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-1">
                  {[2, 3, 5].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTicketsCount(qty)}
                      className={`w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${ticketsCount === qty
                        ? 'bg-cyan-500 text-[#000c18] font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Display: S/. y el monto en una sola línea fija sin quebrarse */}
            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-300">Total a verificar en voucher:</span>
              <span className="text-lg sm:text-xl font-heading font-extrabold text-cyan-300 whitespace-nowrap">
                S/. {(ticketsCount * TICKET_PRICE).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Voucher Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Captura del Voucher de Pago (Plin): <span className="text-cyan-400">*</span>
            </label>

            {!voucherImage ? (
              <label className="relative border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#030617]/60 hover:bg-[#030617] transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400 group-hover:scale-105 transition-transform mb-3">
                  SUBIR
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Seleccionar foto del comprobante de pago
                </p>
                <p className="text-xs text-slate-500 mt-1">Formatos permitidos: PNG, JPG, JPEG (máx. 8MB)</p>
              </label>
            ) : (
              <div className="p-4 rounded-2xl bg-[#030617] border border-cyan-500/40 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={voucherImage}
                  alt="Voucher Preview"
                  className="w-24 h-32 object-cover rounded-xl border border-white/10 shadow-md"
                />
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-bold">
                    <span>Comprobante cargado correctamente</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate max-w-xs">{voucherFileName || 'comprobante-pago.jpg'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVoucherImage('');
                    setVoucherFileName('');
                  }}
                  className="px-3 py-1.5 text-xs text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 rounded-lg transition-colors"
                >
                  Cambiar Imagen
                </button>
              </div>
            )}
          </div>

          {/* Optional: Notes / Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Notas / Referencia (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Plin realizado al delegado"
              className="w-full bg-[#030617] border border-cyan-500/20 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !authenticatedSeller}
              className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-600 border border-cyan-500/30 text-white font-heading font-bold text-xs sm:!text-[16px] tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando Boleto...</span>
                </>
              ) : (
                <>
                  <span>Registrar Venta (S/. {(ticketsCount * TICKET_PRICE).toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
