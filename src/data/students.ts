import type { PromoCode, Student } from '../types';

export const PROMO_CODES: PromoCode[] = [
  '21',
  '22-2',
  '23-1',
  '23-2',
  '24-1',
  '25-1',
  '25-2',
  '26-1',
  '26-2',
  'CEIIS',
];

export const TICKET_PRICE = 3.0; // S/. 3.00 por rifa
export const TARGET_PER_PROMO = 150; // Meta referencial de 150 rifas por código
export const TOTAL_EXPECTED_TICKETS = 2000; // Estimado general de venta (~2,000 rifas)

// Base de datos de estudiantes iniciales con su código de ingreso real y roles
// NOTA DE SEGURIDAD: Las contraseñas NO se exponen en este archivo.
// La autenticación se valida de manera segura y privada directamente contra Supabase.
export const INITIAL_STUDENTS: Student[] = [
  // Miembros CEIIS
  { studentCode: '20232639E', fullName: 'JOSECARLOS MARTIN VALENZUELA ARROYO', promoCode: '23-2', role: 'ceiis' },
  { studentCode: '20232134K', fullName: 'ANTONI JESUS AYALA VILLEGAS', promoCode: '23-1', role: 'ceiis' },
  { studentCode: '20251062A', fullName: 'CARLOS ROBERTO DÍAZ VENTURÓN', promoCode: '25-2', role: 'ceiis' },
  { studentCode: '20244026C', fullName: 'YOISSY ALINA KORELLY ARAUJO ESCOBAR', promoCode: '24-1', role: 'ceiis' },
  { studentCode: '20250011D', fullName: 'VICTOR MARIANO LUYO CALDERON', promoCode: '25-1', role: 'ceiis' },
  { studentCode: '20244517G', fullName: 'LEONEL ADRIANO CRUZADO VEGA', promoCode: 'CEIIS', role: 'ceiis' },
  { studentCode: '20234016E', fullName: 'ALEXANDER DIAZ ORDOÑEZ', promoCode: '23-1', role: 'ceiis' },
  { studentCode: '20231242D', fullName: 'RICCO DIDIER RASHUAMAN SAPALLANAY', promoCode: '23-2', role: 'ceiis' },
  { studentCode: '20251176G', fullName: 'JEAN ROOSEVELT YBARRA POMA', promoCode: '25-2', role: 'ceiis' },
  { studentCode: '20262302I', fullName: 'IVANNA VALENTINA TENAZOA BERNALES', promoCode: '26-1', role: 'ceiis' },
  { studentCode: '20262315C', fullName: 'ADEL ELÍAS SANDOVAL QUISPE', promoCode: '26-1', role: 'ceiis' },
  { studentCode: '20244531J', fullName: 'ADRIAN CRISTOPHER SOTO MAYTA', promoCode: 'CEIIS', role: 'ceiis' },
  { studentCode: '20230220G', fullName: 'DIEGO MILITO CACERES GALVAN', promoCode: '23-1', role: 'ceiis' },
  { studentCode: '20240059D', fullName: 'RODRIGO ALDAHIR QUISPE MARCELO', promoCode: '24-1', role: 'ceiis' },
  { studentCode: '20231288D', fullName: 'AMIR ALEX HUAKE CANDAMO', promoCode: '23-2', role: 'ceiis' },
  { studentCode: '20242102D', fullName: 'MARIA GABRIELA JORGE QUISPE', promoCode: '24-1', role: 'ceiis' },
  { studentCode: '20224075I', fullName: 'JORGE JULINO CARHUAS SOLIS', promoCode: 'CEIIS', role: 'ceiis' },
  { studentCode: '20211357K', fullName: 'JEAN PIERE VASQUEZ MERCADO', promoCode: '21', role: 'ceiis' },
  { studentCode: '20231368H', fullName: 'RUBI ALLISON QUISPE SIERRA', promoCode: '23-2', role: 'ceiis' },
  { studentCode: '20244545K', fullName: 'RENATO ENRIQUE GUTIERREZ SERRA', promoCode: 'CEIIS', role: 'ceiis' },
  { studentCode: '20230258D', fullName: 'ALVARO RAFAEL COLÁN ALEJO', promoCode: '23-1', role: 'ceiis' },

  // Delegados y Subdelegados de Códigos
  { studentCode: '20211447J', fullName: 'YANELA CORAIMA SEVILLANO CALDAS', promoCode: '21', role: 'delegado' },
  { studentCode: '20212685A', fullName: 'FERNANDO ALEXIS CORDOVA REBAZA', promoCode: '21', role: 'delegado' },
  { studentCode: '20224527G', fullName: 'MAYK AHMED NIETO ESPINOZA', promoCode: '22-2', role: 'delegado' },
  { studentCode: '20221262B', fullName: 'SEBASTIAN VICTOR CARDENAS LUJAN', promoCode: '22-2', role: 'delegado' },
  { studentCode: '20234017A', fullName: 'FABIO NOLO CASTILLO VELEZ', promoCode: '23-1', role: 'delegado' },
  { studentCode: '20230276B', fullName: 'RICARDO SOLANO HUETE', promoCode: '23-1', role: 'delegado' },
  { studentCode: '20232600A', fullName: 'CARLOS JESUS CAHUANA CHAVEZ', promoCode: '23-2', role: 'delegado' },
  { studentCode: '20231077C', fullName: 'RENZO RODRIGO HUAMAN CHIQUILLAN', promoCode: '23-2', role: 'delegado' },
  { studentCode: '20240296F', fullName: 'SEBASTIAN RICARDO SEDANO ARRIGUELA', promoCode: '24-1', role: 'delegado' },
  { studentCode: '20254092I', fullName: 'JOSE LUIS CANCHANYA RAMOS', promoCode: '25-1', role: 'delegado' },
  { studentCode: '20252025B', fullName: 'LUIS FERNANDO VERAMENDI ORTIZ', promoCode: '25-1', role: 'delegado' },
  { studentCode: '20251060I', fullName: 'CHRISTOPHER RICARDO ACOSTA SIMON', promoCode: '25-2', role: 'delegado' },
  { studentCode: '20252532A', fullName: 'GONZALO ALDAIR PAUCAR CUEVA', promoCode: '25-2', role: 'delegado' },
  { studentCode: '20262039F', fullName: 'JOSE CONSTANTINO CASTAÑEDA CHACON', promoCode: '26-1', role: 'delegado' },
  { studentCode: '20262139K', fullName: 'MARYURIT BRILLITH TERRONES REYES', promoCode: '26-1', role: 'delegado' },
  { studentCode: '20262607D', fullName: 'FACUNDO JOAQUIN PARRA DEZA', promoCode: '26-2', role: 'delegado' },
  { studentCode: '20264525E', fullName: 'AZIEL ISAÍ LLACHO CUEVA', promoCode: '26-2', role: 'delegado' },
];
