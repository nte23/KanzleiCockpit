/* ============================================================
 * KanzleiCockpit – UI Preview
 * 14 stacked screens, ECharts + tiny vanilla JS interactions.
 * ============================================================ */

(function () {
  'use strict';

  // ----- Theme tokens -----
  const C = {
    gold:       '#C9A961',
    goldBright: '#E0BE6D',
    goldDim:    '#8E7430',
    goldDarker: '#665323',
    navy:       '#2D5092',
    navyLight:  '#4A78C7',
    navyDeep:   '#1A325A',
    navyDark:   '#0F1E36',
    teal:       '#5BB7B3',
    text:       '#E8ECF4',
    muted:      '#9AAAC4',
    grid:       'rgba(201,169,97,0.08)',
    axis:       'rgba(154,170,196,0.4)',
    success:    '#5EE6A0',
    successDim: '#7BD389',
    danger:     '#FF8FA3',
    amber:      '#F5C97F',
    gray:       '#5A6B85',
    grayDark:   '#3F4F6E',
    grayDeep:   '#2A3850',
    warm:       '#A5824A',
  };

  function baseOpts() {
    return {
      textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: C.muted },
      grid: { left: 36, right: 12, top: 18, bottom: 22, containLabel: true },
      tooltip: {
        backgroundColor: 'rgba(15,30,54,0.96)',
        borderColor: 'rgba(201,169,97,0.35)',
        borderWidth: 1,
        textStyle: { color: C.text, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11 },
        extraCssText: 'box-shadow: 0 12px 32px rgba(0,0,0,0.5); backdrop-filter: blur(6px);'
      },
      animationDuration: 500,
      animationEasing: 'cubicOut',
    };
  }

  const eurShort = (v) => {
    const a = Math.abs(v);
    if (a >= 1_000_000) return '€ ' + (v / 1_000_000).toFixed(2).replace('.', ',') + ' M';
    if (a >= 1_000)     return '€ ' + Math.round(v / 1000) + ' k';
    return '€ ' + v;
  };
  const eurK = (v) => '€ ' + Math.round(v) + ' k';
  const pct  = (v) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' %';

  const PERIODS = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  // ============================================================
  // DATA
  // ============================================================

  const DEPARTMENTS = [
    { id: 'patente',    name: 'Patente',    umsatz: 7_840_000, kosten: 3_310_000, stunden: 41_200, headcount: 18 },
    { id: 'marken',     name: 'Marken',     umsatz: 2_960_000, kosten: 1_180_000, stunden: 14_800, headcount: 7  },
    { id: 'designs',    name: 'Designs',    umsatz:   810_000, kosten:   360_000, stunden:  4_600, headcount: 2  },
    { id: 'litigation', name: 'Litigation', umsatz: 1_840_000, kosten:   720_000, stunden:  9_200, headcount: 5  },
    { id: 'verwaltung', name: 'Verwaltung', umsatz:   836_000, kosten:   600_000, stunden: 12_840, headcount: 15 },
  ];

  const DEPT_SEASONALITY = {
    patente:    [1, 1.02, 1.05, 1.04, 1.02, 1.08, 0.92, 0.85, 1.04, 1.12, 1.10, 1.18],
    marken:     [1, 1.01, 1.03, 1.05, 1.04, 1.04, 0.95, 0.88, 1.01, 1.08, 1.06, 1.10],
    designs:    [1, 1.00, 1.04, 0.95, 0.98, 1.05, 1.10, 0.92, 1.00, 1.04, 1.02, 1.06],
    litigation: [1, 1.05, 1.10, 0.95, 0.92, 1.00, 0.85, 0.80, 1.05, 1.15, 1.18, 1.20],
    verwaltung: [1, 1.00, 1.00, 1.00, 1.00, 1.02, 1.00, 0.98, 1.00, 1.02, 1.00, 1.05],
  };
  function monthlyRevenue(dept) {
    const f = DEPT_SEASONALITY[dept.id], sum = f.reduce((a, b) => a + b, 0);
    return f.map(x => Math.round(dept.umsatz * (x / sum)));
  }

  const PARTNERS = [
    { id: 'brenner', name: 'Dr. Brenner', dept: 'patente'    },
    { id: 'voss',    name: 'Voss',        dept: 'patente'    },
    { id: 'koehler', name: 'Köhler',      dept: 'patente'    },
    { id: 'lange',   name: 'Dr. Lange',   dept: 'marken'     },
    { id: 'mertens', name: 'Mertens',     dept: 'litigation' },
    { id: 'haupt',   name: 'Dr. Haupt',   dept: 'patente'    },
  ];

  const ASSOCIATES = ['Albers', 'Bachmann', 'Cremer', 'Dornstetter', 'Eckert', 'Frenzel', 'Gerlach', 'Hofbauer', 'Imhoff', 'Jelinek', 'Kraus', 'Lambrecht', 'Mendel', 'Neuhaus', 'Ostermann'];

  const ASSOC_FLOWS = [
    ['Albers',      { brenner: 280, voss: 90 }],
    ['Bachmann',    { voss: 320, koehler: 60 }],
    ['Cremer',      { brenner: 240, haupt: 130 }],
    ['Dornstetter', { mertens: 360 }],
    ['Eckert',      { lange: 290, haupt: 60 }],
    ['Frenzel',     { koehler: 310, voss: 50 }],
    ['Gerlach',     { brenner: 200, mertens: 130 }],
    ['Hofbauer',    { haupt: 340, brenner: 40 }],
    ['Imhoff',      { lange: 260, voss: 110 }],
    ['Jelinek',     { mertens: 220, koehler: 110 }],
    ['Kraus',       { voss: 280, brenner: 60 }],
    ['Lambrecht',   { haupt: 270, lange: 90 }],
    ['Mendel',      { koehler: 250, mertens: 90 }],
    ['Neuhaus',     { brenner: 210, lange: 130 }],
    ['Ostermann',   { mertens: 290, haupt: 80 }],
  ];

  const TOP_BILLERS = [
    { name: 'Dr. Brenner', role: 'Partner',   value: 1_840_000 },
    { name: 'Voss',        role: 'Partner',   value: 1_510_000 },
    { name: 'Dr. Lange',   role: 'Partner',   value: 1_240_000 },
    { name: 'Mertens',     role: 'Partner',   value: 1_180_000 },
    { name: 'Köhler',      role: 'Partner',   value: 1_060_000 },
    { name: 'Dr. Haupt',   role: 'Partner',   value:   980_000 },
    { name: 'Hofbauer',    role: 'Associate', value:   620_000 },
    { name: 'Dornstetter', role: 'Associate', value:   540_000 },
    { name: 'Ostermann',   role: 'Associate', value:   480_000 },
    { name: 'Kraus',       role: 'Associate', value:   430_000 },
  ];

  const ANW_SCATTER = [
    { name: 'Dr. Brenner', role: 'Partner',  util: 96, real: 93 },
    { name: 'Voss',        role: 'Partner',  util: 92, real: 91 },
    { name: 'Köhler',      role: 'Partner',  util: 88, real: 89 },
    { name: 'Dr. Lange',   role: 'Partner',  util: 84, real: 90 },
    { name: 'Mertens',     role: 'Partner',  util: 95, real: 78 },
    { name: 'Dr. Haupt',   role: 'Partner',  util: 80, real: 88 },
    { name: 'Albers',      role: 'Associate', util: 81, real: 85 },
    { name: 'Bachmann',    role: 'Associate', util: 87, real: 86 },
    { name: 'Cremer',      role: 'Associate', util: 76, real: 80 },
    { name: 'Dornstetter', role: 'Associate', util: 94, real: 82 },
    { name: 'Eckert',      role: 'Associate', util: 70, real: 79 },
    { name: 'Frenzel',     role: 'Associate', util: 89, real: 87 },
    { name: 'Gerlach',     role: 'Associate', util: 72, real: 83 },
    { name: 'Hofbauer',    role: 'Associate', util: 96, real: 84 },
    { name: 'Imhoff',      role: 'Associate', util: 82, real: 86 },
    { name: 'Jelinek',     role: 'Associate', util: 78, real: 81 },
    { name: 'Kraus',       role: 'Associate', util: 91, real: 88 },
    { name: 'Lambrecht',   role: 'Associate', util: 84, real: 85 },
    { name: 'Mendel',      role: 'Associate', util: 80, real: 82 },
    { name: 'Neuhaus',     role: 'Associate', util: 75, real: 80 },
    { name: 'Ostermann',   role: 'Associate', util: 92, real: 86 },
  ];

  const CLIENTS = [
    { id: 'helios',   name: 'Helios Pharma AG',         industry: 'Pharma & Biotech', country: 'Deutschland', partner: 'Dr. Brenner', revenue: 612_400, margin: 61, orders: 84, newOrders: 24,  rate: 410 },
    { id: 'sumire',   name: 'Sumire Robotics K.K.',     industry: 'Maschinenbau',     country: 'Japan',       partner: 'Voss',        revenue: 488_900, margin: 54, orders: 52, newOrders: 12,  rate: 420 },
    { id: 'meridian', name: 'Meridian Semiconductors',  industry: 'Halbleiter',       country: 'USA',         partner: 'Dr. Haupt',   revenue: 471_200, margin: 49, orders: 41, newOrders: 18,  rate: 460 },
    { id: 'fjordsen', name: 'Fjordsen Energi AS',       industry: 'Chemie',           country: 'Schweden',    partner: 'Köhler',      revenue: 408_300, margin: 58, orders: 36, newOrders: -8,  rate: 440 },
    { id: 'novexa',   name: 'NovExa Biosciences',       industry: 'Pharma & Biotech', country: 'Schweiz',     partner: 'Dr. Brenner', revenue: 386_700, margin: 63, orders: 47, newOrders: 31,  rate: 470 },
    { id: 'pankraz',  name: 'Pankraz Werkzeugbau GmbH', industry: 'Maschinenbau',     country: 'Deutschland', partner: 'Voss',        revenue: 354_100, margin: 41, orders: 62, newOrders: -3,  rate: 360 },
    { id: 'altair',   name: 'Altair Motorsport',        industry: 'Automotive',       country: 'Italien',     partner: 'Dr. Lange',   revenue: 338_500, margin: 52, orders: 28, newOrders: 14,  rate: 430 },
    { id: 'kymera',   name: 'Kymera Software Ltd.',     industry: 'Software',         country: 'UK',          partner: 'Dr. Brenner', revenue: 312_600, margin: 67, orders: 24, newOrders: -18, rate: 480 },
    { id: 'aurelius', name: 'Aurelius Chemie KGaA',     industry: 'Chemie',           country: 'Deutschland', partner: 'Köhler',      revenue: 297_400, margin: 39, orders: 71, newOrders: 6,   rate: 340 },
    { id: 'hanwool',  name: 'Hanwool Display Co.',      industry: 'Halbleiter',       country: 'Südkorea',    partner: 'Dr. Haupt',   revenue: 286_900, margin: 56, orders: 33, newOrders: 41,  rate: 450 },
    { id: 'lumenia',  name: 'Lumenia Optics SA',        industry: 'Halbleiter',       country: 'Frankreich',  partner: 'Voss',        revenue: 271_800, margin: 51, orders: 26, newOrders: 9,   rate: 440 },
    { id: 'kestrel',  name: 'Kestrel BioWorks',         industry: 'Pharma & Biotech', country: 'USA',         partner: 'Dr. Brenner', revenue: 263_200, margin: 60, orders: 22, newOrders: 27,  rate: 475 },
    { id: 'rhenus',   name: 'Rhenus Hydraulik',         industry: 'Maschinenbau',     country: 'Deutschland', partner: 'Voss',        revenue: 249_700, margin: 44, orders: 58, newOrders: 1,   rate: 350 },
    { id: 'tessera',  name: 'Tessera Mobility B.V.',    industry: 'Automotive',       country: 'Niederlande', partner: 'Dr. Lange',   revenue: 238_400, margin: 48, orders: 30, newOrders: 11,  rate: 420 },
    { id: 'oryza',    name: 'Oryza AgriTech',           industry: 'Chemie',           country: 'Japan',       partner: 'Köhler',      revenue: 224_900, margin: 53, orders: 25, newOrders: 16,  rate: 430 },
    { id: 'praxion',  name: 'Praxion Medical',          industry: 'Pharma & Biotech', country: 'Schweiz',     partner: 'Dr. Brenner', revenue: 218_300, margin: 59, orders: 28, newOrders: 4,   rate: 460 },
    { id: 'velorum',  name: 'Velorum E-Mobility',       industry: 'Automotive',       country: 'Deutschland', partner: 'Dr. Lange',   revenue: 207_500, margin: 36, orders: 44, newOrders: 22,  rate: 360 },
    { id: 'kollath',  name: 'Kollath & Söhne GmbH',     industry: 'Konsumgüter',      country: 'Deutschland', partner: 'Dr. Lange',   revenue: 192_100, margin: 47, orders: 39, newOrders: -5,  rate: 350 },
    { id: 'arctica',  name: 'Arctica Materials',        industry: 'Chemie',           country: 'Schweden',    partner: 'Köhler',      revenue: 184_900, margin: 50, orders: 21, newOrders: 8,   rate: 410 },
    { id: 'paragon',  name: 'Paragon Audio Systems',    industry: 'Konsumgüter',      country: 'USA',         partner: 'Dr. Lange',   revenue: 176_300, margin: 55, orders: 19, newOrders: 13,  rate: 440 },
    { id: 'metafora', name: 'Metafora AI Labs',         industry: 'Software',         country: 'Deutschland', partner: 'Voss',        revenue: 168_700, margin: 64, orders: 17, newOrders: 33,  rate: 470 },
    { id: 'corvus',   name: 'Corvus Defense',           industry: 'Maschinenbau',     country: 'UK',          partner: 'Mertens',     revenue: 161_400, margin: 42, orders: 23, newOrders: -22, rate: 380 },
    { id: 'finora',   name: 'Finora Consumer Brands',   industry: 'Konsumgüter',      country: 'Italien',     partner: 'Dr. Lange',   revenue: 154_200, margin: 38, orders: 35, newOrders: 2,   rate: 330 },
    { id: 'noria',    name: 'Noria Renewables',         industry: 'Chemie',           country: 'Niederlande', partner: 'Köhler',      revenue: 148_700, margin: 51, orders: 18, newOrders: 19,  rate: 430 },
  ];
  function clientTrend(c) {
    const base = c.revenue / 12, growth = c.newOrders / 100 / 11;
    const noise = [-0.06, 0.04, -0.02, 0.05, -0.04, 0.03, -0.05, 0.06, -0.03, 0.04, -0.02, 0.05];
    return PERIODS.map((_, i) => Math.round(base * (1 + growth * i + noise[i])));
  }
  CLIENTS.forEach(c => { c.trend = clientTrend(c); });

  const WORLD_DATA = [
    { name: 'Germany',        de: 'Deutschland', coord: [10.5, 51.0],  revenue: 7_490_000, yoy:  8 },
    { name: 'United States',  de: 'USA',         coord: [-95.7, 39.0], revenue: 1_530_000, yoy: 14 },
    { name: 'Switzerland',    de: 'Schweiz',     coord: [8.2, 46.8],   revenue:   930_000, yoy: 11 },
    { name: 'Japan',          de: 'Japan',       coord: [138.3, 36.2], revenue:   860_000, yoy: 18 },
    { name: 'Korea',          de: 'Südkorea',    coord: [127.8, 36.5], revenue:   590_000, yoy: 41 },
    { name: 'United Kingdom', de: 'UK',          coord: [-1.5, 53.0],  revenue:   540_000, yoy: -12 },
    { name: 'France',         de: 'Frankreich',  coord: [2.3, 46.6],   revenue:   470_000, yoy:  5 },
    { name: 'Netherlands',    de: 'Niederlande', coord: [5.3, 52.1],   revenue:   410_000, yoy:  9 },
    { name: 'Sweden',         de: 'Schweden',    coord: [18.6, 60.1],  revenue:   390_000, yoy:  6 },
    { name: 'Italy',          de: 'Italien',     coord: [12.5, 42.8],  revenue:   360_000, yoy:  3 },
    { name: 'Austria',        de: 'Österreich',  coord: [14.5, 47.5],  revenue:   220_000, yoy:  7 },
    { name: 'China',          de: 'China',       coord: [104.2, 35.9], revenue:   210_000, yoy: 22 },
    { name: 'Canada',         de: 'Kanada',      coord: [-106, 56],    revenue:   180_000, yoy: 10 },
    { name: 'Spain',          de: 'Spanien',     coord: [-3.7, 40.4],  revenue:   150_000, yoy:  2 },
    { name: 'Denmark',        de: 'Dänemark',    coord: [10.0, 56.2],  revenue:   140_000, yoy:  8 },
    { name: 'Singapore',      de: 'Singapur',    coord: [103.8, 1.35], revenue:   130_000, yoy: 25 },
    { name: 'Belgium',        de: 'Belgien',     coord: [4.5, 50.6],   revenue:   120_000, yoy:  4 },
    { name: 'Israel',         de: 'Israel',      coord: [34.85, 31.0], revenue:   110_000, yoy: 16 },
  ];

  const FUNNEL = [
    { name: 'Erstkontakt',     count: 124, value: 6_200_000 },
    { name: 'Qualifiziert',    count: 78,  value: 4_500_000 },
    { name: 'Angebot',         count: 42,  value: 2_900_000 },
    { name: 'In Verhandlung',  count: 21,  value: 1_650_000 },
    { name: 'Mandat erteilt',  count: 13,  value:   980_000 },
  ];

  // ---- Cost categories (12-month, in €k) ----
  const COST_CATS = [
    { id: 'persBT',   name: 'Personal · Berufsträger',  group: 'personal', color: C.gold,
      monthly: [380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380], yoy: 6 },
    { id: 'persVw',   name: 'Personal · Verwaltung',    group: 'personal', color: C.goldDim,
      monthly: [134, 134, 134, 134, 134, 134, 134, 134, 134, 134, 134, 134], yoy: 3 },
    { id: 'externe',  name: 'Externe Dienstleister',    group: 'run',      color: C.warm,
      monthly: [72, 75, 80, 78, 76, 78, 70, 65, 82, 85, 80, 88], yoy: 9 },
    { id: 'reisen',   name: 'Reisen · Mandanten / Konferenz', group: 'invest', color: C.success,
      monthly: [12, 18, 22, 24, 20, 18, 10, 8, 22, 26, 24, 30], yoy: 18 },
    { id: 'marketing',name: 'Marketing & PR',           group: 'invest',   color: C.teal,
      monthly: [10, 12, 15, 22, 18, 14, 8, 6, 16, 22, 20, 24], yoy: 18 },
    { id: 'fortb',    name: 'Fortbildung',              group: 'invest',   color: C.successDim,
      monthly: [4, 6, 8, 8, 6, 4, 4, 4, 8, 12, 14, 8], yoy: 12 },
    { id: 'raum',     name: 'Raum & Nebenkosten',       group: 'run',      color: C.navy,
      monthly: [32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32], yoy: 0 },
    { id: 'it',       name: 'IT & Software',            group: 'run',      color: C.navyLight,
      monthly: [25, 22, 24, 26, 25, 24, 22, 21, 27, 28, 26, 30], yoy: 24 },
    { id: 'versich',  name: 'Versicherungen (Berufshaftpflicht etc.)', group: 'run', color: C.gray,
      monthly: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15], yoy: 5 },
    { id: 'afa',      name: 'Abschreibungen',           group: 'run',      color: C.grayDark,
      monthly: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12], yoy: -2 },
    { id: 'sonst',    name: 'Sonstiges (Bürobedarf, Bewirtung)', group: 'run', color: C.grayDeep,
      monthly: [10, 9, 11, 10, 9, 11, 10, 8, 11, 12, 10, 12], yoy: 2 },
    { id: 'amts',     name: 'Amts- & Verfahrensgebühren (durchlaufend)', group: 'durchlauf', color: '#94A3B8',
      monthly: [148, 152, 158, 162, 154, 148, 135, 128, 162, 168, 160, 175], yoy: 14 },
  ];

  // ---- Marketing-ROI ----
  const ROI_CHANNELS = [
    { name: 'Reise-Pitches',         spend: 140, revenue: 1320 },
    { name: 'Konferenzen',           spend: 102, revenue:  690 },
    { name: 'Sponsoring',            spend:  79, revenue:  445 },
    { name: 'Print / PR',            spend:  55, revenue:   95 },
    { name: 'Web / SEO',             spend:  45, revenue:  290 },
  ];
  const TRAVEL_BY_PARTNER = [
    { name: 'Dr. Brenner', travel: 38, newRev: 580 },
    { name: 'Voss',        travel: 28, newRev: 420 },
    { name: 'Köhler',      travel: 42, newRev: 380 },
    { name: 'Dr. Lange',   travel: 18, newRev: 240 },
    { name: 'Mertens',     travel: 22, newRev: 180 },
    { name: 'Dr. Haupt',   travel: 14, newRev: 200 },
  ];

  // ---- Liquidity 13 weeks ----
  const LIQ_WEEKS    = ['KW 25','KW 26','KW 27','KW 28','KW 29','KW 30','KW 31','KW 32','KW 33','KW 34','KW 35','KW 36','KW 37'];
  const LIQ_INFLOW   = [   0, 480, 320, 280, 250, 220, 180, 160, 180, 220, 250, 180, 220];
  const LIQ_OUTFLOW  = [   0,  65, 617,  65,  65,  65, 617,  65,  65, 617, 415, 345, 617];
  const LIQ_BALANCE  = (() => {
    let b = 1200, out = []; for (let i = 0; i < LIQ_WEEKS.length; i++) { b += LIQ_INFLOW[i] - LIQ_OUTFLOW[i]; out.push(b); } return out;
  })();

  // ============================================================
  // STATE & CACHE
  // ============================================================
  const state = {
    deptFilter: null,
    partnerFilter: null,
    clientSort: { key: 'revenue', dir: 'desc' },
    clientSearch: '', clientIndustry: '', clientCountry: '',
    activeTpl: 'quartal',
  };

  const charts = {};
  function getOrInit(id, opts = {}) {
    const el = document.getElementById(id); if (!el) return null;
    if (!charts[id]) charts[id] = echarts.init(el, null, { renderer: opts.renderer || 'svg' });
    return charts[id];
  }
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(c => { try { c && c.resize(); } catch (e) {} });
  });

  // ============================================================
  // 02 / EXECUTIVE COCKPIT
  // ============================================================
  function renderCockpitTrend() {
    const ch = getOrInit('cockpitTrend'); if (!ch) return;
    const umsatz = [9.2, 9.6, 10.3, 10.8, 11.1, 11.6, 12.1, 11.8, 12.4, 13.0, 13.6, 14.3];
    const kosten = [4.2, 4.4, 4.5, 4.7, 4.8, 4.9, 5.0, 4.9, 5.1, 5.3, 5.4, 5.6];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 8, bottom: 18, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis',
        formatter: (params) => `<div style="font-weight:600;color:${C.text};margin-bottom:3px;">${params[0].axisValue} 2026</div>` +
          params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;color:${C.muted};font-size:11px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">€ ${p.value.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})} M</span></div>`).join('') },
      xAxis: { type: 'category', data: PERIODS, boundaryGap: false, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' M' } },
      series: [
        { name: 'Umsatz', type: 'line', smooth: true, symbol: 'none', data: umsatz,
          lineStyle: { width: 2.2, color: C.goldBright },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(201,169,97,0.32)' }, { offset: 1, color: 'rgba(201,169,97,0)' }] } } },
        { name: 'Personal', type: 'line', smooth: true, symbol: 'none', data: kosten,
          lineStyle: { width: 1.6, color: C.navy, type: 'dashed' } }
      ]
    });
  }

  function renderCockpitDept() {
    const ch = getOrInit('cockpitDept'); if (!ch) return;
    const palette = ['#C9A961', '#E0BE6D', '#8E7430', '#2D5092', '#4A78C7'];
    ch.setOption({
      ...baseOpts(),
      tooltip: { ...baseOpts().tooltip,
        formatter: (p) => `<div style="font-weight:600;color:${C.text};">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${eurShort(p.value)} · ${p.percent}%</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      series: [{
        type: 'pie', radius: ['54%', '76%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 }, label: { show: false }, labelLine: { show: false },
        data: DEPARTMENTS.map((d, i) => ({ name: d.name, value: d.umsatz, itemStyle: { color: palette[i] } }))
      }]
    });
  }

  // ============================================================
  // 03 / KOSTEN-STRUKTUR
  // ============================================================
  function renderCostStack() {
    const ch = getOrInit('costStack'); if (!ch) return;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 8, bottom: 32, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:3px;">${params[0].axisValue} 2026</div>`;
          let tot = 0;
          params.forEach(p => { tot += p.value; });
          params.slice().reverse().forEach(p => {
            s += `<div style="display:flex;justify-content:space-between;gap:12px;color:${C.muted};font-size:10.5px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">€ ${p.value} k</span></div>`;
          });
          s += `<div style="margin-top:3px;padding-top:3px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:12px;"><span style="color:${C.muted};font-size:10.5px;">Gesamt</span><span style="color:${C.goldBright};font-weight:600;font-size:10.5px;">€ ${tot} k</span></div>`;
          return s;
        }
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 9 }, itemWidth: 8, itemHeight: 8, type: 'scroll' },
      xAxis: { type: 'category', data: PERIODS, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' k' } },
      series: COST_CATS.map(cat => ({
        name: cat.name, type: 'bar', stack: 'cost', data: cat.monthly, barWidth: 14,
        itemStyle: { color: cat.color, borderRadius: cat.id === COST_CATS[COST_CATS.length-1].id ? [3,3,0,0] : 0 }
      }))
    });
  }

  function renderCostDonut() {
    const ch = getOrInit('costDonut'); if (!ch) return;
    const sum = (m) => m.reduce((a, b) => a + b, 0);
    const data = COST_CATS.map(cat => ({ name: cat.name, value: sum(cat.monthly), itemStyle: { color: cat.color } }));
    ch.setOption({
      ...baseOpts(),
      tooltip: { ...baseOpts().tooltip,
        formatter: (p) => `<div style="font-weight:600;color:${C.text};">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">€ ${p.value} k · ${p.percent}%</div>` },
      legend: { type: 'scroll', bottom: 0, textStyle: { color: C.muted, fontSize: 9 }, itemWidth: 8, itemHeight: 8 },
      series: [{
        type: 'pie', radius: ['52%', '76%'], center: ['50%', '42%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 1.5 }, label: { show: false }, labelLine: { show: false },
        data
      }]
    });
  }

  function renderCostYoy() {
    const ch = getOrInit('costYoy'); if (!ch) return;
    const data = COST_CATS.slice().sort((a, b) => a.yoy - b.yoy);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 30, top: 6, bottom: 6, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p[0].name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">YoY ${p[0].value > 0 ? '+' : ''}${p[0].value} %</div>` },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => (v > 0 ? '+' : '') + v + '%' } },
      yAxis: { type: 'category', data: data.map(d => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10, width: 160, overflow: 'truncate' } },
      series: [{
        type: 'bar', barWidth: 9,
        data: data.map(d => ({ value: d.yoy, itemStyle: { color: d.yoy > 15 ? C.danger : d.yoy > 0 ? d.color : C.success, borderRadius: [0, 3, 3, 0] } })),
        label: { show: true, position: 'right', color: C.muted, fontSize: 9, formatter: (p) => (p.value > 0 ? '+' : '') + p.value + ' %' }
      }]
    });
  }

  // ============================================================
  // 04 / ABTEILUNGEN
  // ============================================================
  function visibleDepartments() { return state.deptFilter ? DEPARTMENTS.filter(d => d.id === state.deptFilter) : DEPARTMENTS; }

  function updateAbtKPIs() {
    const depts = visibleDepartments();
    const sumU = depts.reduce((a, d) => a + d.umsatz, 0);
    const sumK = depts.reduce((a, d) => a + d.kosten, 0);
    const sumH = depts.reduce((a, d) => a + d.stunden, 0);
    const marge = sumU ? ((sumU - sumK) / sumU) * 100 : 0;
    document.getElementById('kpiAbtUmsatz').textContent  = eurShort(sumU);
    document.getElementById('kpiAbtKosten').textContent  = eurShort(sumK);
    document.getElementById('kpiAbtStunden').textContent = sumH.toLocaleString('de-DE') + ' h';
    document.getElementById('kpiAbtMarge').textContent   = pct(marge);
  }

  function updateAbtFilterChip() {
    const chip = document.getElementById('abtFilterChip'); if (!chip) return;
    if (!state.deptFilter) { chip.textContent = 'Alle Abteilungen'; return; }
    const d = DEPARTMENTS.find(x => x.id === state.deptFilter);
    chip.textContent = d ? d.name : 'Alle Abteilungen';
  }

  function renderAbtBar() {
    const ch = getOrInit('abtBar'); if (!ch) return;
    const f = state.deptFilter;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 8, right: 12, top: 12, bottom: 18, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => `<div style="font-weight:600;color:${C.text};margin-bottom:3px;">${params[0].axisValue}</div>` +
          params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;color:${C.muted};font-size:11px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">${eurShort(p.value)}</span></div>`).join('') },
      xAxis: { type: 'category', data: DEPARTMENTS.map(d => d.name), axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000) + ' M' : (v / 1000) + ' k' } },
      series: [
        { name: 'Umsatz', type: 'bar', barWidth: 14,
          data: DEPARTMENTS.map(d => ({ value: d.umsatz, itemStyle: { color: !f || f === d.id ? C.gold : 'rgba(201,169,97,0.2)', borderRadius: [3, 3, 0, 0] } })) },
        { name: 'Personalkosten', type: 'bar', barWidth: 14,
          data: DEPARTMENTS.map(d => ({ value: d.kosten, itemStyle: { color: !f || f === d.id ? C.navy : 'rgba(45,80,146,0.25)', borderRadius: [3, 3, 0, 0] } })) }
      ]
    });
    ch.off('click');
    ch.on('click', (p) => {
      const dept = DEPARTMENTS.find(d => d.name === p.name); if (!dept) return;
      state.deptFilter = (state.deptFilter === dept.id) ? null : dept.id;
      refreshAbteilungen();
    });
  }

  function renderAbtDonut() {
    const ch = getOrInit('abtDonut'); if (!ch) return;
    const palette = ['#C9A961', '#E0BE6D', '#8E7430', '#2D5092', '#4A78C7'];
    const f = state.deptFilter;
    ch.setOption({
      ...baseOpts(),
      tooltip: { ...baseOpts().tooltip,
        formatter: (p) => `<div style="font-weight:600;color:${C.text};">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${p.value.toLocaleString('de-DE')} h · ${p.percent}%</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      series: [{
        type: 'pie', radius: ['54%', '76%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 }, label: { show: false }, labelLine: { show: false },
        data: DEPARTMENTS.map((d, i) => ({ name: d.name, value: d.stunden, itemStyle: { color: !f || f === d.id ? palette[i] : 'rgba(255,255,255,0.08)' } }))
      }]
    });
    ch.off('click');
    ch.on('click', (p) => {
      const dept = DEPARTMENTS.find(d => d.name === p.name); if (!dept) return;
      state.deptFilter = (state.deptFilter === dept.id) ? null : dept.id;
      refreshAbteilungen();
    });
  }

  function renderAbtArea() {
    const ch = getOrInit('abtArea'); if (!ch) return;
    const palette = { patente: '#C9A961', marken: '#E0BE6D', designs: '#8E7430', litigation: '#2D5092', verwaltung: '#4A78C7' };
    const depts = state.deptFilter ? DEPARTMENTS.filter(d => d.id === state.deptFilter) : DEPARTMENTS;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 6, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis',
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:3px;">${params[0].axisValue}</div>`;
          let tot = 0; params.forEach(p => { tot += p.value; s += `<div style="display:flex;justify-content:space-between;gap:12px;color:${C.muted};font-size:11px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">${eurShort(p.value)}</span></div>`; });
          s += `<div style="margin-top:3px;padding-top:3px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:12px;"><span style="color:${C.muted};font-size:11px;">Gesamt</span><span style="color:${C.goldBright};font-weight:600;font-size:11px;">${eurShort(tot)}</span></div>`;
          return s;
        } },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      xAxis: { type: 'category', boundaryGap: false, data: PERIODS, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' } },
      series: depts.map(d => ({
        name: d.name, type: 'line', stack: 'total', smooth: true, symbol: 'none', data: monthlyRevenue(d),
        lineStyle: { width: 1.4, color: palette[d.id] }, areaStyle: { opacity: 0.55, color: palette[d.id] }
      }))
    });
  }

  function renderAbtHighlights() {
    const ul = document.getElementById('abtHighlights'); if (!ul) return;
    const items = state.deptFilter ? (() => {
      const d = DEPARTMENTS.find(x => x.id === state.deptFilter), m = monthlyRevenue(d);
      const best = m.indexOf(Math.max(...m));
      return [
        { tone: 'note', text: `<strong>${d.name}</strong>: ${eurShort(d.umsatz)} Umsatz, ${d.headcount} MA.` },
        { tone: 'up',   text: `Stärkster Monat: <strong>${PERIODS[best]}</strong> mit ${eurShort(m[best])}.` },
        { tone: 'note', text: `${d.stunden.toLocaleString('de-DE')} h · Umsatz/Std. € ${Math.round(d.umsatz / d.stunden)}.` },
      ];
    })() : [
      { tone: 'up',   text: '<strong>Patente</strong> 55 % vom Umsatz, 3. Wachstumsquartal.' },
      { tone: 'down', text: '<strong>Verwaltung</strong>: 16 % der Stunden, 6 % vom Umsatz.' },
      { tone: 'up',   text: '<strong>Litigation</strong> höchste Marge (61 %), Kapazität ausgereizt.' },
    ];
    ul.innerHTML = items.map(it => {
      const dot = it.tone === 'up' ? `<span class="up">▲</span>` : it.tone === 'down' ? `<span class="down">▼</span>` : `<span class="text-gold-300">◆</span>`;
      return `<li class="flex gap-2"><span class="mt-0.5">${dot}</span><span class="text-slate-300">${it.text}</span></li>`;
    }).join('');
  }

  function refreshAbteilungen() {
    updateAbtKPIs(); updateAbtFilterChip();
    renderAbtBar(); renderAbtDonut(); renderAbtArea(); renderAbtHighlights();
  }

  // ============================================================
  // 05 / ANWALTS-MATRIX
  // ============================================================
  function updatePartnerFilterChip() {
    const chip = document.getElementById('partnerFilterChip'); if (!chip) return;
    if (!state.partnerFilter) { chip.textContent = 'Alle Partner'; return; }
    const p = PARTNERS.find(x => x.id === state.partnerFilter);
    chip.textContent = p ? p.name : 'Alle Partner';
  }

  function renderAnwSankey() {
    const ch = getOrInit('anwSankey'); if (!ch) return;
    const partnerById = Object.fromEntries(PARTNERS.map(p => [p.id, p]));
    const focus = state.partnerFilter;
    const nodes = [
      ...ASSOCIATES.map(a => ({ name: a, depth: 0, itemStyle: { color: '#2D5092' } })),
      ...PARTNERS.map(p => ({ name: p.name, depth: 1, itemStyle: { color: focus && focus !== p.id ? 'rgba(201,169,97,0.25)' : C.gold } })),
    ];
    const links = [];
    ASSOC_FLOWS.forEach(([assoc, flows]) => {
      Object.entries(flows).forEach(([pid, hours]) => {
        const partner = partnerById[pid]; if (!partner) return;
        const dimmed = focus && focus !== pid;
        links.push({
          source: assoc, target: partner.name, value: hours,
          lineStyle: { color: dimmed ? 'rgba(45,80,146,0.15)' : 'rgba(201,169,97,0.45)', opacity: dimmed ? 0.4 : 0.85, curveness: 0.5 }
        });
      });
    });
    ch.setOption({
      ...baseOpts(),
      tooltip: { ...baseOpts().tooltip, trigger: 'item',
        formatter: (p) => p.dataType === 'edge'
          ? `<div style="color:${C.text};font-weight:600;">${p.data.source} → ${p.data.target}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${p.value.toLocaleString('de-DE')} Std/Q</div>`
          : `<div style="color:${C.text};font-weight:600;">${p.name}</div>` },
      series: [{
        type: 'sankey', left: 4, right: 100, top: 6, bottom: 6,
        nodeWidth: 12, nodeGap: 4, layoutIterations: 24, emphasis: { focus: 'adjacency' },
        data: nodes, links: links,
        label: { color: C.muted, fontSize: 10.5, fontFamily: 'Inter' }, lineStyle: { color: 'source' }
      }]
    });
    ch.off('click');
    ch.on('click', (p) => {
      if (p.dataType !== 'node') return;
      const partner = PARTNERS.find(x => x.name === p.name); if (!partner) return;
      state.partnerFilter = (state.partnerFilter === partner.id) ? null : partner.id;
      refreshAnwaelte();
    });
  }

  function renderAnwBar() {
    const ch = getOrInit('anwBar'); if (!ch) return;
    const data = [...TOP_BILLERS].sort((a, b) => a.value - b.value);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 28, top: 6, bottom: 6, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => { const p = params[0], row = data.find(d => d.name === p.name);
          return `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;">${row.role}</div><div style="color:${C.goldBright};font-weight:600;margin-top:1px;">${eurShort(p.value)}</div>`; } },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' } },
      yAxis: { type: 'category', data: data.map(d => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 10 } },
      series: [{
        type: 'bar', barWidth: 10,
        data: data.map(d => ({ value: d.value, itemStyle: { color: d.role === 'Partner' ? C.gold : C.navy, borderRadius: [0, 3, 3, 0] } })),
        label: { show: true, position: 'right', color: C.muted, fontSize: 9, formatter: (p) => eurShort(p.value) }
      }]
    });
  }

  function renderAnwScatter() {
    const ch = getOrInit('anwScatter'); if (!ch) return;
    const partners   = ANW_SCATTER.filter(x => x.role === 'Partner').map(x => [x.util, x.real, x.name]);
    const associates = ANW_SCATTER.filter(x => x.role === 'Associate').map(x => [x.util, x.real, x.name]);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 28, right: 14, top: 6, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'item', formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.value[2]}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">Aus. ${p.value[0]} % · Real. ${p.value[1]} %</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 } },
      xAxis: { name: 'Auslastung %', nameLocation: 'middle', nameGap: 22, nameTextStyle: { color: C.muted, fontSize: 10 }, min: 60, max: 100, axisLine: { lineStyle: { color: C.axis } }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9 } },
      yAxis: { name: 'Realiz. %', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: C.muted, fontSize: 10 }, min: 70, max: 100, axisLine: { lineStyle: { color: C.axis } }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9 } },
      series: [
        { name: 'Partner',   type: 'scatter', symbolSize: 11, data: partners,   itemStyle: { color: C.gold, opacity: 0.9, borderColor: 'rgba(255,255,255,0.2)' } },
        { name: 'Associate', type: 'scatter', symbolSize: 9,  data: associates, itemStyle: { color: C.navy, opacity: 0.85, borderColor: 'rgba(255,255,255,0.2)' } },
      ]
    });
  }

  function renderAnwHighlights() {
    const ul = document.getElementById('anwHighlights'); if (!ul) return;
    const items = state.partnerFilter ? (() => {
      const p = PARTNERS.find(x => x.id === state.partnerFilter);
      const flows = ASSOC_FLOWS.filter(([a, f]) => f[p.id]).map(([a, f]) => ({ a, h: f[p.id] }));
      const total = flows.reduce((s, f) => s + f.h, 0);
      flows.sort((a, b) => b.h - a.h);
      return [
        { tone: 'note', text: `<strong>${p.name}</strong>: ${total.toLocaleString('de-DE')} Junior-Std/Q.` },
        { tone: 'up',   text: `Top-Zuarbeit: <strong>${flows[0].a}</strong> (${flows[0].h} h).` },
        { tone: 'note', text: `Zuarbeiter: ${flows.length}.` },
      ];
    })() : [
      { tone: 'up',   text: '<strong>Mertens</strong>: höchste Auslastung (95 %), niedrigste Realization (78 %).' },
      { tone: 'note', text: '<strong>Hofbauer</strong>: 96 % — Belastungsgrenze.' },
      { tone: 'down', text: '<strong>Eckert</strong>: 70 % — Kapazität für Neugeschäft.' },
    ];
    ul.innerHTML = items.map(it => {
      const dot = it.tone === 'up' ? `<span class="up">▲</span>` : it.tone === 'down' ? `<span class="down">▼</span>` : `<span class="text-gold-300">◆</span>`;
      return `<li class="flex gap-2"><span class="mt-0.5">${dot}</span><span class="text-slate-300">${it.text}</span></li>`;
    }).join('');
  }

  function refreshAnwaelte() {
    updatePartnerFilterChip();
    renderAnwSankey(); renderAnwBar(); renderAnwScatter(); renderAnwHighlights();
  }

  // ============================================================
  // 06 / ANWALTS-PROFIL
  // ============================================================
  function renderProfHours() {
    const ch = getOrInit('profHours'); if (!ch) return;
    const billable    = [142, 138, 156, 148, 162, 167, 110, 95, 158, 172, 168, 0];
    const nonBillable = [22, 26, 18, 24, 16, 14, 38, 42, 18, 12, 14, 0];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 6, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 } },
      xAxis: { type: 'category', data: PERIODS, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' h' } },
      series: [
        { name: 'Billable', type: 'bar', stack: 'h', data: billable, barWidth: 14, itemStyle: { color: C.gold } },
        { name: 'Nicht-billable', type: 'bar', stack: 'h', data: nonBillable, barWidth: 14, itemStyle: { color: 'rgba(45,80,146,0.7)', borderRadius: [3, 3, 0, 0] } }
      ]
    });
  }

  function renderProfClients() {
    const ch = getOrInit('profClients'); if (!ch) return;
    const data = [
      { name: 'Helios Pharma',         value: 287 },
      { name: 'NovExa Biosciences',    value: 142 },
      { name: 'Meridian Semicond.',    value: 118 },
      { name: 'Hanwool Display',       value:  96 },
      { name: 'Aurelius Chemie',       value:  72 },
      { name: 'Übrige',                value: 267 },
    ];
    const palette = ['#C9A961', '#E0BE6D', '#B6953E', '#8E7430', '#2D5092', '#1A325A'];
    ch.setOption({
      ...baseOpts(),
      tooltip: { ...baseOpts().tooltip, formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${p.value} h · ${p.percent}%</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      series: [{
        type: 'pie', radius: ['54%', '76%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 }, label: { show: false }, labelLine: { show: false },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: palette[i] } }))
      }]
    });
  }

  // ============================================================
  // 07 / MANDANTEN-LISTE
  // ============================================================
  function trendArrow(n) {
    if (n > 8)  return `<span class="up">▲ +${n} %</span>`;
    if (n < -3) return `<span class="down">▼ ${n} %</span>`;
    return `<span class="text-slate-400">▬ ${n > 0 ? '+' : ''}${n} %</span>`;
  }

  function sparklineSVG(data) {
    const w = 90, h = 22, p = 2;
    const min = Math.min(...data), max = Math.max(...data), span = (max - min) || 1;
    const stepX = (w - p * 2) / (data.length - 1);
    const pts = data.map((v, i) => [p + i * stepX, h - p - ((v - min) / span) * (h - p * 2)]);
    const d = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ');
    const slope = pts[pts.length - 1][1] - pts[0][1];
    const color = slope < -2 ? '#5EE6A0' : slope > 2 ? '#FF8FA3' : '#C9A961';
    const fillD = d + ` L${pts[pts.length - 1][0].toFixed(1)},${h - p} L${pts[0][0].toFixed(1)},${h - p} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
              <path d="${fillD}" fill="${color}" opacity="0.12"/>
              <path d="${d}" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
  }

  function filteredClients() {
    const q = state.clientSearch.toLowerCase().trim();
    return CLIENTS.filter(c => {
      if (state.clientIndustry && c.industry !== state.clientIndustry) return false;
      if (state.clientCountry  && c.country  !== state.clientCountry)  return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function sortedClients() {
    const arr = filteredClients().slice();
    const { key, dir } = state.clientSort, factor = dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = a[key], bv = b[key];
      if (typeof av === 'string') return av.localeCompare(bv, 'de') * factor;
      return (av - bv) * factor;
    });
    return arr;
  }

  function renderClientsTable() {
    const tbody = document.getElementById('clientsTbody'); if (!tbody) return;
    const list = sortedClients();
    tbody.innerHTML = list.map(c => `
      <tr class="hover:bg-gold-400/5">
        <td class="px-3 py-1.5 text-slate-100">${c.name}</td>
        <td class="px-3 py-1.5 text-slate-300">${c.industry}</td>
        <td class="px-3 py-1.5 text-slate-300">${c.country}</td>
        <td class="px-3 py-1.5 text-slate-300">${c.partner}</td>
        <td class="px-3 py-1.5 text-right text-slate-100 font-medium">${eurShort(c.revenue)}</td>
        <td class="px-3 py-1.5 text-right ${c.margin >= 55 ? 'text-gold-200' : 'text-slate-300'}">${c.margin} %</td>
        <td class="px-3 py-1.5 text-right">${trendArrow(c.newOrders)}</td>
        <td class="px-3 py-1.5">${sparklineSVG(c.trend)}</td>
      </tr>
    `).join('');

    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = '↕';
      if (th.dataset.key === state.clientSort.key) {
        th.classList.add(state.clientSort.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        if (arrow) arrow.textContent = state.clientSort.dir === 'asc' ? '↑' : '↓';
      }
    });
    document.getElementById('clientsRowsInfo').textContent = `${list.length} Mandanten`;
  }

  function setupMandantenControls() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (state.clientSort.key === key) state.clientSort.dir = state.clientSort.dir === 'asc' ? 'desc' : 'asc';
        else { state.clientSort.key = key; state.clientSort.dir = (key === 'name' || key === 'industry' || key === 'country' || key === 'partner') ? 'asc' : 'desc'; }
        renderClientsTable();
      });
    });
    document.getElementById('clientSearch')?.addEventListener('input',  (e) => { state.clientSearch  = e.target.value; renderClientsTable(); });
    document.getElementById('clientIndustry')?.addEventListener('change', (e) => { state.clientIndustry = e.target.value; renderClientsTable(); });
    document.getElementById('clientCountry')?.addEventListener('change',  (e) => { state.clientCountry  = e.target.value; renderClientsTable(); });
  }

  // ============================================================
  // 08 / MANDANTEN-DETAIL
  // ============================================================
  function renderClientLine() {
    const ch = getOrInit('cltLine'); if (!ch) return;
    const months = [];
    const now = new Date(2026, 5, 1);
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][d.getMonth()] + ' ' + (d.getFullYear() + '').slice(2));
    }
    const base = 38000;
    const data = months.map((_, i) => Math.round(base * (1 + i * 0.018) + Math.sin(i / 1.5) * 7000));
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 8, bottom: 18, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', formatter: (p) => `<div style="color:${C.muted};font-size:11px;">${p[0].axisValue}</div><div style="color:${C.text};font-weight:600;">${eurShort(p[0].value)}</div>` },
      xAxis: { type: 'category', data: months, boundaryGap: false, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 9, interval: 2 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v >= 1000 ? (v / 1000).toFixed(0) + ' k' : v } },
      series: [{
        type: 'line', smooth: true, symbol: 'none', data,
        lineStyle: { width: 2.2, color: C.goldBright },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(201,169,97,0.4)' }, { offset: 1, color: 'rgba(201,169,97,0)' }] } }
      }]
    });
  }

  function renderClientSH() {
    const ch = getOrInit('cltSH'); if (!ch) return;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 0, right: 6, top: 6, bottom: 0, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('') },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['Haben (Rechn.)', 'Soll (Eingang)'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      series: [{ name: 'Betrag', type: 'bar', data: [612400, 568200], barWidth: 14,
        itemStyle: { color: (p) => p.dataIndex === 0 ? C.gold : C.success, borderRadius: [3, 3, 3, 3] },
        label: { show: true, position: 'insideRight', color: C.text, fontSize: 9, formatter: (p) => eurShort(p.value) } }]
    });
  }

  function renderClientAging() {
    const ch = getOrInit('cltAging'); if (!ch) return;
    const buckets = [
      { name: 'aktuell', value: 18400, color: C.success },
      { name: '0–30',    value: 22100, color: C.gold },
      { name: '31–60',   value: 14000, color: C.amber },
      { name: '61–90',   value:  3700, color: C.danger },
    ];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 0, right: 6, top: 8, bottom: 0, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('') },
      legend: { show: false },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['OPOS'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      series: buckets.map((b, i) => ({
        name: b.name, type: 'bar', stack: 'a', data: [b.value], barWidth: 16,
        itemStyle: { color: b.color, borderRadius: i === 0 ? [3, 0, 0, 3] : i === buckets.length - 1 ? [0, 3, 3, 0] : 0 },
        label: { show: b.value > 2500, position: 'inside', color: '#0A1628', fontWeight: 600, fontSize: 9, formatter: () => b.name }
      }))
    });
  }

  // ============================================================
  // 09 / WELTKARTE
  // ============================================================
  let worldMapRegistered = false;
  function loadWorldMap() {
    return new Promise((resolve, reject) => {
      if (worldMapRegistered) return resolve();
      const urls = [
        'https://cdn.jsdelivr.net/gh/apache/echarts@4.9.0/map/json/world.json',
        'https://fastly.jsdelivr.net/gh/apache/echarts@4.9.0/map/json/world.json'
      ];
      const tryNext = (i) => {
        if (i >= urls.length) return reject(new Error('No world map source'));
        fetch(urls[i]).then(r => { if (!r.ok) throw new Error('fetch fail'); return r.json(); })
          .then(geo => { echarts.registerMap('world', geo); worldMapRegistered = true; resolve(); })
          .catch(() => tryNext(i + 1));
      };
      tryNext(0);
    });
  }

  function renderWorldMap() {
    const el = document.getElementById('worldMap'); if (!el) return;
    const fb = document.getElementById('worldMapFallback');
    loadWorldMap().then(() => {
      fb && fb.classList.add('hidden');
      const ch = (charts.worldMap = charts.worldMap || echarts.init(el, null, { renderer: 'canvas' }));
      const maxRev = Math.max(...WORLD_DATA.map(d => d.revenue));
      const points = WORLD_DATA.map(d => ({ name: d.de, value: [...d.coord, d.revenue], yoy: d.yoy }));
      ch.setOption({
        ...baseOpts(),
        tooltip: { ...baseOpts().tooltip, trigger: 'item',
          formatter: (p) => {
            if (p.seriesType === 'scatter') {
              const yoy = p.data.yoy;
              const yoyTxt = yoy >= 0 ? `<span style="color:${C.success}">+${yoy} %</span>` : `<span style="color:${C.danger}">${yoy} %</span>`;
              return `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${eurShort(p.value[2])} · YoY ${yoyTxt}</div>`;
            }
            return p.name;
          } },
        geo: { map: 'world', roam: false, silent: true, left: 0, right: 0, top: 4, bottom: 4, itemStyle: { areaColor: 'rgba(45,80,146,0.22)', borderColor: 'rgba(201,169,97,0.18)' }, emphasis: { disabled: true } },
        series: [{
          name: 'Umsatz', type: 'scatter', coordinateSystem: 'geo',
          symbolSize: (val) => Math.max(5, Math.sqrt(val[2] / maxRev) * 36),
          itemStyle: {
            color: (p) => { const y = p.data.yoy; if (y >= 20) return C.success; if (y >= 8) return C.goldBright; if (y >= 0) return C.gold; return C.danger; },
            opacity: 0.85, borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1, shadowBlur: 12, shadowColor: 'rgba(201,169,97,0.45)'
          },
          data: points, z: 5
        }]
      });
      ch.off('click');
      ch.on('click', (p) => { if (p.seriesType !== 'scatter') return; document.getElementById('worldFilterChip').textContent = p.name; });
    }).catch(() => { fb && fb.classList.remove('hidden'); });
  }

  function renderWorldBar() {
    const ch = getOrInit('worldBar'); if (!ch) return;
    const top = [...WORLD_DATA].sort((a, b) => a.revenue - b.revenue).slice(-10);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 28, top: 6, bottom: 6, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => { const c = top.find(t => t.de === params[0].name);
          const yoyTxt = c.yoy >= 0 ? `<span style="color:${C.success};">+${c.yoy} %</span>` : `<span style="color:${C.danger};">${c.yoy} %</span>`;
          return `<div style="color:${C.text};font-weight:600;">${c.de}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${eurShort(c.revenue)} · ${yoyTxt}</div>`; } },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' } },
      yAxis: { type: 'category', data: top.map(t => t.de), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 10 } },
      series: [{
        type: 'bar', barWidth: 9,
        data: top.map(t => ({ value: t.revenue, itemStyle: { color: t.yoy >= 20 ? C.success : t.yoy >= 0 ? C.gold : C.danger, borderRadius: [0, 3, 3, 0] } })),
        label: { show: true, position: 'right', color: C.muted, fontSize: 9, formatter: (p) => eurShort(p.value) }
      }]
    });
  }

  // ============================================================
  // 10 / PIPELINE
  // ============================================================
  function renderPipeTrend() {
    const ch = getOrInit('pipeTrend'); if (!ch) return;
    const months = ['Jul','Aug','Sep','Okt','Nov','Dez','Jan','Feb','Mrz','Apr','Mai','Jun'];
    const newClients = [3, 2, 4, 5, 4, 6, 5, 4, 7, 6, 5, 7];
    const newMatters = [12, 9, 14, 18, 16, 22, 19, 17, 23, 21, 18, 24];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 6, bottom: 22, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 } },
      xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      yAxis: [
        { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9 } },
        { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: C.muted, fontSize: 9 } }
      ],
      series: [
        { name: 'Aufträge', type: 'bar',  data: newMatters, barWidth: 14, itemStyle: { color: 'rgba(45,80,146,0.65)', borderRadius: [3, 3, 0, 0] } },
        { name: 'Mandanten', type: 'line', yAxisIndex: 1, data: newClients, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: C.goldBright }, itemStyle: { color: C.goldBright } }
      ]
    });
  }

  function renderPipeSource() {
    const ch = getOrInit('pipeSource'); if (!ch) return;
    const data = [
      { name: 'Bestandsmandant',    value: 31 },
      { name: 'Empfehlung',         value: 24 },
      { name: 'Konferenz',          value: 11 },
      { name: 'Direktansprache',    value:  7 },
      { name: 'Web / Suche',        value:  4 },
    ];
    const palette = ['#C9A961', '#E0BE6D', '#8E7430', '#2D5092', '#1A325A'];
    ch.setOption({
      ...baseOpts(),
      tooltip: { ...baseOpts().tooltip, formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:1px;">${p.value} Anfragen · ${p.percent}%</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      series: [{
        type: 'pie', radius: ['54%', '76%'], center: ['50%', '42%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 }, label: { show: false }, labelLine: { show: false },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: palette[i] } }))
      }]
    });
  }

  function renderPipeFunnel() {
    const root = document.getElementById('pipeFunnel'); if (!root) return;
    const max = Math.max(...FUNNEL.map(f => f.count));
    root.innerHTML = FUNNEL.map((f, i) => {
      const w = Math.round(f.count / max * 100);
      const color = i === FUNNEL.length - 1 ? C.gold : i >= FUNNEL.length - 2 ? '#B6953E' : 'rgba(45,80,146,0.7)';
      const conv = i === 0 ? '—' : Math.round(f.count / FUNNEL[i - 1].count * 100) + ' %';
      return `
        <div class="funnel-row">
          <div class="text-[12px] text-slate-200">${f.name}</div>
          <div class="h-5 rounded overflow-hidden bg-ink-800/60 border border-white/5">
            <div class="h-full" style="width:${w}%; background:${color};"></div>
          </div>
          <div class="text-right text-[11.5px] text-slate-300 font-mono">${f.count} · ${eurShort(f.value)}</div>
          <div class="text-right text-[10.5px] text-slate-400">${conv}</div>
        </div>
      `;
    }).join('') + `<div class="funnel-row text-[9px] uppercase tracking-wider text-slate-500 pt-1 border-t border-white/5 mt-1">
        <div>Stufe</div><div>Volumen</div><div class="text-right">Anz · Wert</div><div class="text-right">Konv.</div>
      </div>`;
  }

  // ============================================================
  // 11 / MARKETING & AKQUISE-ROI
  // ============================================================
  function renderRoiChannel() {
    const ch = getOrInit('roiChannel'); if (!ch) return;
    const data = [...ROI_CHANNELS].reverse();
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 28, top: 18, bottom: 6, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const r = data.find(d => d.name === params[0].name);
          const roas = (r.revenue / r.spend).toFixed(1);
          return `<div style="color:${C.text};font-weight:600;">${r.name}</div>` +
            params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;color:${C.muted};font-size:11px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">${eurK(p.value)}</span></div>`).join('') +
            `<div style="color:${C.goldBright};font-weight:600;font-size:11px;margin-top:2px;">ROAS ${roas.replace('.', ',')}×</div>`;
        } },
      legend: { top: 0, right: 4, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' k' } },
      yAxis: { type: 'category', data: data.map(d => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 10 } },
      series: [
        { name: 'Spend',   type: 'bar', barGap: '15%', barWidth: 8,
          data: data.map(d => ({ value: d.spend, itemStyle: { color: 'rgba(255,143,163,0.7)', borderRadius: [0, 3, 3, 0] } })) },
        { name: 'Mandanten-Umsatz', type: 'bar', barWidth: 8,
          data: data.map(d => ({ value: d.revenue, itemStyle: { color: C.success, borderRadius: [0, 3, 3, 0] } })),
          label: { show: true, position: 'right', color: C.muted, fontSize: 9, formatter: (p) => { const r = data[p.dataIndex]; return (r.revenue / r.spend).toFixed(1).replace('.', ',') + '×'; } } }
      ]
    });
  }

  function renderRoiTravel() {
    const ch = getOrInit('roiTravel'); if (!ch) return;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 30, right: 14, top: 6, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'item',
        formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.value[2]}</div><div style="color:${C.muted};font-size:11px;">Reise € ${p.value[0]} k → Neumandanten € ${p.value[1]} k</div>` },
      xAxis: { name: 'Reisekosten YTD', nameLocation: 'middle', nameGap: 22, nameTextStyle: { color: C.muted, fontSize: 10 }, axisLine: { lineStyle: { color: C.axis } }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' k' } },
      yAxis: { name: 'Mandanten-Umsatz', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: C.muted, fontSize: 10 }, axisLine: { lineStyle: { color: C.axis } }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' k' } },
      series: [{
        type: 'scatter', symbolSize: 13,
        data: TRAVEL_BY_PARTNER.map(p => [p.travel, p.newRev, p.name]),
        itemStyle: { color: C.gold, opacity: 0.9, borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1 },
        label: { show: true, position: 'top', color: C.muted, fontSize: 9, formatter: (p) => p.value[2] }
      }]
    });
  }

  // ============================================================
  // 12 / LIQUIDITÄTS-FORECAST
  // ============================================================
  function renderLiqLine() {
    const ch = getOrInit('liqLine'); if (!ch) return;
    const lowIdx = LIQ_BALANCE.indexOf(Math.min(...LIQ_BALANCE.slice(1)));
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 12, bottom: 18, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis',
        formatter: (params) => {
          const i = params[0].dataIndex;
          return `<div style="font-weight:600;color:${C.text};margin-bottom:3px;">${params[0].axisValue}</div>
                  <div style="color:${C.muted};font-size:11px;">Eingang: <span style="color:${C.success}">+ ${eurK(LIQ_INFLOW[i])}</span></div>
                  <div style="color:${C.muted};font-size:11px;">Ausgang: <span style="color:${C.danger}">− ${eurK(LIQ_OUTFLOW[i])}</span></div>
                  <div style="color:${C.text};font-weight:600;font-size:11px;margin-top:2px;">Bestand: ${eurK(LIQ_BALANCE[i])}</div>`;
        } },
      xAxis: { type: 'category', data: LIQ_WEEKS, boundaryGap: false, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 9, interval: 1 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' k' } },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: LIQ_BALANCE,
        lineStyle: { width: 2.2, color: C.goldBright },
        itemStyle: { color: C.goldBright },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(201,169,97,0.32)' }, { offset: 1, color: 'rgba(201,169,97,0)' }] } },
        markLine: { silent: true, symbol: 'none', label: { color: C.muted, fontSize: 9, formatter: 'Lohn-Lauf-Soll' },
          lineStyle: { color: 'rgba(255,143,163,0.5)', type: 'dashed', width: 1 },
          data: [{ yAxis: 520, name: 'Lohn-Lauf' }]
        },
        markPoint: { symbolSize: 36, itemStyle: { color: C.amber },
          label: { color: C.navyDark, fontSize: 10, fontWeight: 700, formatter: (p) => 'Tief' },
          data: [{ coord: [LIQ_WEEKS[lowIdx], LIQ_BALANCE[lowIdx]] }]
        }
      }]
    });
  }

  function renderLiqFlow() {
    const ch = getOrInit('liqFlow'); if (!ch) return;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 6, right: 6, top: 12, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => `<div style="font-weight:600;color:${C.text};margin-bottom:3px;">${params[0].axisValue}</div>` +
          params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurK(Math.abs(p.value))}</span></div>`).join('') },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      xAxis: { type: 'category', data: LIQ_WEEKS, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 9 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v + ' k' } },
      series: [
        { name: 'Eingang',  type: 'bar', stack: 'a', data: LIQ_INFLOW,  barWidth: 10, itemStyle: { color: C.success, borderRadius: [3, 3, 0, 0] } },
        { name: 'Ausgang',  type: 'bar', stack: 'a', data: LIQ_OUTFLOW.map(v => -v), barWidth: 10, itemStyle: { color: 'rgba(255,143,163,0.7)', borderRadius: [3, 3, 0, 0] } }
      ]
    });
  }

  // ============================================================
  // 13 / BUCHUNGS-STREAM
  // ============================================================
  function renderStreamFlow() {
    const ch = getOrInit('streamFlow'); if (!ch) return;
    const days = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
    const debit  = days.map((_, i) => -Math.round(20000 + Math.sin(i / 2) * 9000 + (i * 137 % 5000)));
    const credit = days.map((_, i) =>  Math.round(28000 + Math.cos(i / 3) * 12000 + (i * 211 % 6000)));
    ch.setOption({
      ...baseOpts(),
      grid: { left: 4, right: 4, top: 6, bottom: 6, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 8, interval: 5 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 8, formatter: (v) => v / 1000 + 'k' } },
      series: [
        { name: 'Haben', type: 'bar', stack: 's', data: credit, barWidth: 6, itemStyle: { color: C.gold } },
        { name: 'Soll',  type: 'bar', stack: 's', data: debit,  barWidth: 6, itemStyle: { color: 'rgba(255,143,163,0.7)' } }
      ]
    });
  }

  function renderOpsAging() {
    const ch = getOrInit('opsAging'); if (!ch) return;
    const buckets = [
      { name: '0–30',  value: 312_000, color: C.success },
      { name: '31–60', value: 168_000, color: C.gold },
      { name: '61–90', value:  74_000, color: C.amber },
      { name: '> 90',  value:  41_000, color: C.danger },
    ];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 0, right: 6, top: 8, bottom: 0, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('') },
      legend: { show: false },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['OPOS'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
      series: buckets.map((b, i) => ({
        name: b.name, type: 'bar', stack: 'a', data: [b.value], barWidth: 16,
        itemStyle: { color: b.color, borderRadius: i === 0 ? [3, 0, 0, 3] : i === buckets.length - 1 ? [0, 3, 3, 0] : 0 },
        label: { show: true, position: 'inside', color: '#0A1628', fontWeight: 600, fontSize: 9, formatter: () => b.name }
      }))
    });
  }

  // ============================================================
  // 14 / BRIEFING-BIBLIOTHEK
  // ============================================================
  const TEMPLATES = {
    quartal: {
      title: 'Quartals-Briefing',
      desc:  'Partner-Briefing für die Gesellschafter-Versammlung',
      cover: `
        <div class="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ink-800/80">
          <span class="grid place-items-center w-5 h-5 rounded bg-ink-950">
            <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="#E0BE6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 L3 7 L8 11 L12 7 L17 13 L21 9"/></svg>
          </span>KanzleiCockpit · Partner-Briefing
        </div>
        <div class="mt-auto">
          <div class="text-[10px] text-ink-800/70">Brenner &amp; Voss Partner mbB</div>
          <div class="font-display text-3xl mt-1.5 leading-tight">Quartal 2 · 2026</div>
          <div class="font-display text-sm mt-0.5 italic text-ink-800/80">Wirtschaftliche Lage und Mandantenstruktur</div>
          <div class="mt-4 grid grid-cols-3 gap-3 border-t border-ink-950/15 pt-3">
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Umsatz</div><div class="font-display text-lg mt-0.5">€ 7,42 M</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Marge</div><div class="font-display text-lg mt-0.5">57,1 %</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Realiz.</div><div class="font-display text-lg mt-0.5">87,3 %</div></div>
          </div>
          <div class="text-[9px] text-ink-800/60 mt-4">Vertraulich · Nur für Gesellschafter · 30.06.2026</div>
        </div>`,
      inside: `
        <div class="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink-800/70 border-b border-ink-950/15 pb-1.5">
          <span>Q2 2026 · Lage &amp; Trends</span><span>Seite 3 / 14</span>
        </div>
        <h3 class="font-display text-base mt-2.5">1. Wirtschaftliche Entwicklung</h3>
        <p class="text-[11px] text-ink-800/80 mt-1 leading-relaxed">
          Quartalsumsatz € 7,42 M, +11,4 % YoY. Treiber sind Patente (+14,2 %) und Litigation (+18,7 %).
          Verwaltungsumsätze unverändert.
        </p>
        <div class="grid grid-cols-3 gap-2 mt-3">
          <div class="rounded border border-ink-950/12 p-1.5"><div class="text-[8px] uppercase tracking-wider text-ink-800/70">Patente</div><div class="font-display text-sm mt-0.5">€ 4,11 M</div><div class="text-[9px] text-emerald-700">+14,2 %</div></div>
          <div class="rounded border border-ink-950/12 p-1.5"><div class="text-[8px] uppercase tracking-wider text-ink-800/70">Litigation</div><div class="font-display text-sm mt-0.5">€ 1,02 M</div><div class="text-[9px] text-emerald-700">+18,7 %</div></div>
          <div class="rounded border border-ink-950/12 p-1.5"><div class="text-[8px] uppercase tracking-wider text-ink-800/70">Marken</div><div class="font-display text-sm mt-0.5">€ 1,52 M</div><div class="text-[9px] text-emerald-700">+4,1 %</div></div>
        </div>
        <h3 class="font-display text-base mt-4">2. Beobachtungen</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li>Hanwool Display (KR) entwickelt sich zum Top-10-Mandanten — +41 % YoY.</li>
          <li>Kymera Software (UK) zweites rückläufiges Quartal in Folge (−18 %).</li>
          <li>Hofbauer / Dornstetter strukturell &gt; 90 % — Backup-Kapazität bilden.</li>
          <li>Marketing+Reisen 2,9 % vom Umsatz, ROAS 6,7× — Budget kann erhöht werden.</li>
        </ul>
        <div class="mt-auto pt-3 border-t border-ink-950/15 flex items-center justify-between text-[9px] text-ink-800/60">
          <span>Brenner &amp; Voss Partner mbB</span><span>Vertraulich</span>
        </div>`
    },

    onepager: {
      title: 'Mandanten-Onepager',
      desc:  'Briefing vor dem Termin · Helios Pharma AG',
      cover: `
        <div class="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ink-800/80">
          <span class="grid place-items-center w-5 h-5 rounded bg-ink-950">
            <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="#E0BE6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 L3 7 L8 11 L12 7 L17 13 L21 9"/></svg>
          </span>Mandanten-Briefing
        </div>
        <div class="mt-auto">
          <div class="text-[10px] text-ink-800/70">Brenner &amp; Voss Partner mbB</div>
          <div class="font-display text-2xl mt-1.5 leading-tight">Helios Pharma AG</div>
          <div class="font-display text-xs mt-0.5 italic text-ink-800/80">Vor dem Jour-Fixe am 15.07.2026</div>
          <div class="mt-3 grid grid-cols-2 gap-2 border-t border-ink-950/15 pt-3">
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Umsatz YTD</div><div class="font-display text-base mt-0.5">€ 612 k</div><div class="text-[9px] text-emerald-700">+24 % YoY</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Aufträge YTD</div><div class="font-display text-base mt-0.5">84</div><div class="text-[9px] text-emerald-700">+24 %</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Offene Akten</div><div class="font-display text-base mt-0.5">12</div><div class="text-[9px] text-ink-800/70">davon 4 in Frist</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">OPOS &gt; 30 Tg</div><div class="font-display text-base mt-0.5">€ 3,7 k</div><div class="text-[9px] text-emerald-700">unkritisch</div></div>
          </div>
          <div class="mt-3 text-[10px] text-ink-800/80">
            <div><strong>Mandant seit:</strong> 2014 · 12 Jahre Beziehung</div>
            <div><strong>Verantw. Partner:</strong> Dr. Brenner</div>
            <div><strong>Branche:</strong> Pharma &amp; Biotech · Deutschland</div>
            <div><strong>Letzter Termin:</strong> 03.04.2026 (Quartals-Update)</div>
          </div>
          <div class="text-[9px] text-ink-800/60 mt-3">Vertraulich · Nur für vorbereitenden Partner</div>
        </div>`,
      inside: `
        <div class="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink-800/70 border-b border-ink-950/15 pb-1.5">
          <span>Helios Pharma · Lage &amp; Gesprächsbausteine</span><span>2 / 2</span>
        </div>
        <h3 class="font-display text-sm mt-2.5">Beziehung 2014 → heute</h3>
        <div class="text-[11px] text-ink-800/80 mt-1 leading-relaxed">
          Volumen seit 2020 verdoppelt. 2026 erstmals &gt; € 1 M Run-Rate erwartet.
          Schwerpunkt: EP-Anmeldungen Wirkstoff-Patente, zunehmend US/JP-Erweiterungen.
        </div>
        <h3 class="font-display text-sm mt-3">Aktuelle Lage</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li>12 offene Akten, 4 mit Frist (P-2024-0247 US in 14 Tg, M-2025-0012 EU in 3 Tg).</li>
          <li>Letzte Rechnung 28.06. (€ 28 400) — bezahlt 28.06., pünktlich.</li>
          <li>70 % Stunden auf Brenner + Hofbauer — <em class="not-italic text-amber-700">Konzentrationsrisiko</em>.</li>
          <li>Realization 92 % — Top-Quartil, kaum Abschriften.</li>
        </ul>
        <h3 class="font-display text-sm mt-3">Gesprächsbausteine</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li>Kapazitäts-Erweiterung 2026 H2 — Backup-Anwalt für Brenner-Linie.</li>
          <li>JP-Strategie weiter ausbauen (Sumire-Kontext nutzen).</li>
          <li>Litigation-Praxis vorstellen — bisher nicht im Mandat.</li>
          <li>Dankesnotiz für 2025-Empfehlung an NovExa.</li>
        </ul>
        <div class="mt-auto pt-3 border-t border-ink-950/15 flex items-center justify-between text-[9px] text-ink-800/60">
          <span>Brenner &amp; Voss Partner mbB</span><span>Stand 30.06.2026</span>
        </div>`
    },

    partner: {
      title: 'Partner-Jahresgespräch',
      desc:  'Halbjahres-Review · Dr. Brenner',
      cover: `
        <div class="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ink-800/80">
          <span class="grid place-items-center w-5 h-5 rounded bg-ink-950">
            <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="#E0BE6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 L3 7 L8 11 L12 7 L17 13 L21 9"/></svg>
          </span>Partnerschafts-Review
        </div>
        <div class="mt-auto">
          <div class="text-[10px] text-ink-800/70">Brenner &amp; Voss Partner mbB</div>
          <div class="font-display text-2xl mt-1.5 leading-tight">Dr. Markus Brenner</div>
          <div class="font-display text-xs mt-0.5 italic text-ink-800/80">Halbjahres-Gespräch · 2026 H1</div>
          <div class="mt-4 grid grid-cols-2 gap-2 border-t border-ink-950/15 pt-3">
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Beitrag YTD</div><div class="font-display text-base mt-0.5">€ 1,84 M</div><div class="text-[9px] text-emerald-700">+12 % YoY</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Mandanten</div><div class="font-display text-base mt-0.5">47</div><div class="text-[9px] text-ink-800/70">+5 neue</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Stunden YTD</div><div class="font-display text-base mt-0.5">1 180 h</div><div class="text-[9px] text-amber-700">96 % Auslast.</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Realization</div><div class="font-display text-base mt-0.5">93 %</div><div class="text-[9px] text-emerald-700">Top-3 Partner</div></div>
          </div>
          <div class="mt-3 text-[10px] text-ink-800/80">
            <div><strong>Equity-Status:</strong> Senior Equity Partner (seit 2018)</div>
            <div><strong>Department:</strong> Patente · Co-Lead</div>
            <div><strong>Mentee-Anwälte:</strong> Hofbauer, Cremer, Albers</div>
          </div>
          <div class="text-[9px] text-ink-800/60 mt-3">Persönlich · Nur Gesellschafter-Vorsitz</div>
        </div>`,
      inside: `
        <div class="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink-800/70 border-b border-ink-950/15 pb-1.5">
          <span>Dr. Brenner · Beitrag, Portfolio, Team</span><span>2 / 6</span>
        </div>
        <h3 class="font-display text-sm mt-2.5">1. Wirtschaftlicher Beitrag</h3>
        <p class="text-[11px] text-ink-800/80 mt-1 leading-relaxed">
          € 1,84 M Beitrag YTD, höchster aller Partner. Wachstum getrieben durch Helios Pharma
          (+€ 118 k) und 2 strategische Neumandate (Apex Quantum, Veritex BioWorks).
        </p>
        <h3 class="font-display text-sm mt-3">2. Mandanten-Portfolio</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li>Top-3: Helios Pharma € 612 k · NovExa € 387 k · Kymera € 313 k.</li>
          <li>Konzentration: Top-3 = 71 % — über Schwellenwert (60 %).</li>
          <li>Diversifizierung empfohlen — Pipeline 2 Q3-Pitches.</li>
        </ul>
        <h3 class="font-display text-sm mt-3">3. Mentoring &amp; Team</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li>Hofbauer (Mentee): 340 h Zuarbeit, 96 % Auslastung — <em class="not-italic text-amber-700">Backup vorbereiten</em>.</li>
          <li>Cremer, Albers: stabile Entwicklung.</li>
        </ul>
        <h3 class="font-display text-sm mt-3">4. Diskussionspunkte</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li>Reise-Pitch-Budget Q3 (US-Reise NovExa-Erweiterung).</li>
          <li>Nachfolge-Planung Helios — sekundärer Partner aufbauen.</li>
          <li>Equity-Anteils-Anpassung beim Jahres-Review im November.</li>
        </ul>
        <div class="mt-auto pt-3 border-t border-ink-950/15 flex items-center justify-between text-[9px] text-ink-800/60">
          <span>Persönlich</span><span>Stand 30.06.2026</span>
        </div>`
    },

    bench: {
      title: 'Bench-Report',
      desc:  'Auslastung &amp; Kapazität · Stand 30 Tage',
      cover: `
        <div class="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ink-800/80">
          <span class="grid place-items-center w-5 h-5 rounded bg-ink-950">
            <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="#E0BE6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 L3 7 L8 11 L12 7 L17 13 L21 9"/></svg>
          </span>Auslastungs-Report
        </div>
        <div class="mt-auto">
          <div class="text-[10px] text-ink-800/70">Brenner &amp; Voss Partner mbB</div>
          <div class="font-display text-2xl mt-1.5 leading-tight">Bench-Report</div>
          <div class="font-display text-xs mt-0.5 italic text-ink-800/80">Kapazität &amp; Auslastung · 30 Tage</div>
          <div class="mt-4 grid grid-cols-3 gap-2 border-t border-ink-950/15 pt-3">
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Ø Auslastung</div><div class="font-display text-base mt-0.5">84 %</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Über Soll</div><div class="font-display text-base mt-0.5 text-amber-700">4 BT</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Unter Soll</div><div class="font-display text-base mt-0.5 text-emerald-700">3 BT</div></div>
          </div>
          <div class="mt-4 text-[10px] text-ink-800/80">
            Vorlage für die monatliche Ressourcen-Sitzung. Listet Berufsträger, deren Auslastung
            außerhalb des Zielbands liegt, mit Empfehlungen pro Person.
          </div>
          <div class="text-[9px] text-ink-800/60 mt-4">Stand 30.06.2026 · Nur Partner-Versammlung</div>
        </div>`,
      inside: `
        <div class="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink-800/70 border-b border-ink-950/15 pb-1.5">
          <span>Bench-Report · Empfehlungen</span><span>2 / 4</span>
        </div>
        <h3 class="font-display text-sm mt-2.5 text-amber-700">Über-ausgelastet (&gt; 92 %)</h3>
        <table class="w-full text-[11px] mt-1.5">
          <thead class="text-[9px] uppercase tracking-wider text-ink-800/70"><tr><th class="text-left py-1">Person</th><th class="text-left py-1">Rolle</th><th class="text-right py-1">Aus.</th><th class="text-left py-1">Empfehlung</th></tr></thead>
          <tbody class="divide-y divide-ink-950/10">
            <tr><td class="py-1">Dr. Brenner</td><td class="py-1">Partner</td><td class="py-1 text-right">96 %</td><td class="py-1">Hofbauer als Backup auf Helios.</td></tr>
            <tr><td class="py-1">Hofbauer</td><td class="py-1">Associate</td><td class="py-1 text-right">96 %</td><td class="py-1">Akten reduzieren / Cremer einbinden.</td></tr>
            <tr><td class="py-1">Mertens</td><td class="py-1">Partner</td><td class="py-1 text-right">95 %</td><td class="py-1">Realization 78 % — Tarif-Review.</td></tr>
            <tr><td class="py-1">Dornstetter</td><td class="py-1">Associate</td><td class="py-1 text-right">94 %</td><td class="py-1">Jelinek übernimmt 2 Litigation-Akten.</td></tr>
          </tbody>
        </table>
        <h3 class="font-display text-sm mt-3 text-emerald-700">Unter-ausgelastet (&lt; 75 %)</h3>
        <table class="w-full text-[11px] mt-1.5">
          <thead class="text-[9px] uppercase tracking-wider text-ink-800/70"><tr><th class="text-left py-1">Person</th><th class="text-left py-1">Rolle</th><th class="text-right py-1">Aus.</th><th class="text-left py-1">Empfehlung</th></tr></thead>
          <tbody class="divide-y divide-ink-950/10">
            <tr><td class="py-1">Eckert</td><td class="py-1">Associate</td><td class="py-1 text-right">70 %</td><td class="py-1">Akquise-Briefing für Apex Quantum.</td></tr>
            <tr><td class="py-1">Gerlach</td><td class="py-1">Associate</td><td class="py-1 text-right">72 %</td><td class="py-1">Litigation-Backup für Dornstetter.</td></tr>
            <tr><td class="py-1">Neuhaus</td><td class="py-1">Associate</td><td class="py-1 text-right">75 %</td><td class="py-1">Marken-Recherchen Lange übernehmen.</td></tr>
          </tbody>
        </table>
        <div class="mt-auto pt-3 border-t border-ink-950/15 flex items-center justify-between text-[9px] text-ink-800/60">
          <span>Brenner &amp; Voss Partner mbB</span><span>Stand 30.06.2026</span>
        </div>`
    },

    liquid: {
      title: 'Liquiditäts-Memo',
      desc:  'CFO-Briefing · Cashflow KW 25–37',
      cover: `
        <div class="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ink-800/80">
          <span class="grid place-items-center w-5 h-5 rounded bg-ink-950">
            <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="#E0BE6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 L3 7 L8 11 L12 7 L17 13 L21 9"/></svg>
          </span>Liquiditäts-Memo
        </div>
        <div class="mt-auto">
          <div class="text-[10px] text-ink-800/70">Brenner &amp; Voss Partner mbB · Treasury</div>
          <div class="font-display text-2xl mt-1.5 leading-tight">13-Wochen-Forecast</div>
          <div class="font-display text-xs mt-0.5 italic text-ink-800/80">KW 25 – KW 37 · 2026</div>
          <div class="mt-4 grid grid-cols-3 gap-2 border-t border-ink-950/15 pt-3">
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Heute</div><div class="font-display text-base mt-0.5">€ 1,20 M</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Tief KW 37</div><div class="font-display text-base mt-0.5 text-amber-700">€ 522 k</div></div>
            <div><div class="text-[9px] uppercase tracking-wider text-ink-800/70">Marge</div><div class="font-display text-base mt-0.5">~ 1 Mt</div></div>
          </div>
          <div class="mt-4 text-[10px] text-ink-800/80">
            An: Geschäftsführung, geMnG · Empfehlung zu Kreditrahmen, Honorar-Vorschüssen
            und Steuer-Vorauszahlungs-Stundung beigefügt.
          </div>
          <div class="text-[9px] text-ink-800/60 mt-4">Vertraulich · 30.06.2026</div>
        </div>`,
      inside: `
        <div class="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink-800/70 border-b border-ink-950/15 pb-1.5">
          <span>Risiko-Wochen &amp; Empfehlungen</span><span>2 / 3</span>
        </div>
        <h3 class="font-display text-sm mt-2.5">Risiko-Wochen</h3>
        <ul class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-disc pl-4">
          <li><strong>KW 35</strong>: USt-VA Q2 (€ 350 k) am 10.09., direkt vor Lohn-Lauf September. Bestand sinkt auf € 1,08 M.</li>
          <li><strong>KW 36</strong>: ESt-Vorauszahlung Q3 (€ 280 k). Bestand € 919 k.</li>
          <li><strong>KW 37</strong>: Lohn-Lauf Oktober + Miete (€ 552 k). Tiefster Punkt € 522 k — knapp über einem Lohn-Lauf-Soll.</li>
        </ul>
        <h3 class="font-display text-sm mt-3">Empfehlungen</h3>
        <ol class="text-[11px] text-ink-800/80 mt-1 space-y-0.5 list-decimal pl-4">
          <li>Kontokorrent-Linie auf € 500 k aufstocken (aktuell € 200 k) — Kosten ~€ 1,5 k p.a.</li>
          <li>Honorar-Vorschüsse für 2 Großmandanten (Helios, Sumire) für Q3 anstreben.</li>
          <li>Auszahlung Gewinnvorab an Partner um eine Woche in KW 38 verschieben.</li>
          <li>Reise-Budget Q3 priorisieren auf hochwahrscheinliche Pitches.</li>
        </ol>
        <h3 class="font-display text-sm mt-3 text-rose-700">Stresstest −10 %</h3>
        <p class="text-[11px] text-ink-800/80 mt-1 leading-relaxed">
          Wenn 10 % der OPOS um 30 Tage verspätet eingehen, fällt das KW 37-Tief auf € 188 k —
          unterhalb eines Lohn-Lauf-Solls. <strong>Ohne erweiterte Kontokorrent-Linie nicht tragbar.</strong>
        </p>
        <div class="mt-auto pt-3 border-t border-ink-950/15 flex items-center justify-between text-[9px] text-ink-800/60">
          <span>Brenner &amp; Voss · Treasury</span><span>Vertraulich</span>
        </div>`
    },
  };

  function renderTemplateList() {
    const root = document.getElementById('tplList'); if (!root) return;
    root.innerHTML = Object.entries(TEMPLATES).map(([id, t], i) => `
      <div class="tpl-item ${id === state.activeTpl ? 'active' : ''}" data-tpl="${id}">
        <span class="num">0${i + 1}</span>
        <div>
          <div class="lbl">${t.title}</div>
          <div class="desc">${t.desc}</div>
        </div>
      </div>
    `).join('');
    root.querySelectorAll('.tpl-item').forEach(el => {
      el.addEventListener('click', () => {
        state.activeTpl = el.dataset.tpl;
        renderTemplateList();
        renderTemplatePages();
      });
    });
  }

  function renderTemplatePages() {
    const t = TEMPLATES[state.activeTpl]; if (!t) return;
    const cover = document.getElementById('pdfCover');
    const inside = document.getElementById('pdfInside');
    if (cover)  cover.innerHTML  = t.cover;
    if (inside) inside.innerHTML = t.inside;
  }

  // ============================================================
  // SCROLLSPY
  // ============================================================
  function setupScrollspy() {
    const links = Array.from(document.querySelectorAll('#sideNav .side-link'));
    const sections = links.map(l => document.getElementById(l.dataset.target)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !sections.length) { links[0]?.classList.add('active'); return; }
    const setActive = (id) => links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
    const visibility = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => visibility.set(e.target.id, e.intersectionRatio));
      let bestId = null, bestRatio = 0;
      visibility.forEach((ratio, id) => { if (ratio > bestRatio) { bestRatio = ratio; bestId = id; } });
      if (bestId) setActive(bestId);
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach(s => io.observe(s));
    setActive(sections[0].id);
  }

  // ============================================================
  // BOOT
  // ============================================================
  function boot() {
    // 02 Cockpit
    renderCockpitTrend(); renderCockpitDept();
    // 03 Kosten-Struktur
    renderCostStack(); renderCostDonut(); renderCostYoy();
    // 04 Abteilungen
    document.getElementById('abtFilterClear')?.addEventListener('click', () => { state.deptFilter = null; refreshAbteilungen(); });
    refreshAbteilungen();
    // 05 Anwälte
    document.getElementById('partnerFilterClear')?.addEventListener('click', () => { state.partnerFilter = null; refreshAnwaelte(); });
    refreshAnwaelte();
    // 06 Profil
    renderProfHours(); renderProfClients();
    // 07 Liste
    setupMandantenControls(); renderClientsTable();
    // 08 Detail
    renderClientLine(); renderClientSH(); renderClientAging();
    // 09 Welt
    document.getElementById('worldRetry')?.addEventListener('click', (e) => { e.preventDefault(); worldMapRegistered = false; renderWorldMap(); });
    renderWorldMap(); renderWorldBar();
    // 10 Pipeline
    renderPipeTrend(); renderPipeSource(); renderPipeFunnel();
    // 11 Marketing-ROI
    renderRoiChannel(); renderRoiTravel();
    // 12 Liquidität
    renderLiqLine(); renderLiqFlow();
    // 13 Buchungs-Stream
    renderStreamFlow(); renderOpsAging();
    // 14 Briefings
    renderTemplateList(); renderTemplatePages();
    // Scrollspy
    setupScrollspy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
