/* ============================================================
 * KanzleiCockpit – UI Preview
 * Charts und kleine Interaktionen für die 11 Screens.
 * Single-file vanilla JS. Erfordert ECharts global.
 * ============================================================ */

(function () {
  'use strict';

  // ----- Theme tokens -----
  const C = {
    gold:       '#C9A961',
    goldBright: '#E0BE6D',
    goldDim:    '#8E7430',
    navy:       '#2D5092',
    navyDeep:   '#1A325A',
    navyDark:   '#0F1E36',
    text:       '#E8ECF4',
    muted:      '#9AAAC4',
    grid:       'rgba(201,169,97,0.08)',
    axis:       'rgba(154,170,196,0.4)',
    success:    '#5EE6A0',
    danger:     '#FF8FA3',
    amber:      '#F5C97F',
  };

  function baseOpts() {
    return {
      textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: C.muted },
      grid: { left: 40, right: 16, top: 24, bottom: 28, containLabel: true },
      tooltip: {
        backgroundColor: 'rgba(15,30,54,0.96)',
        borderColor: 'rgba(201,169,97,0.35)',
        borderWidth: 1,
        textStyle: { color: C.text, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12 },
        extraCssText: 'box-shadow: 0 12px 40px rgba(0,0,0,0.5); backdrop-filter: blur(6px);'
      },
      animationDuration: 600,
      animationEasing: 'cubicOut',
    };
  }

  // Formatters
  const eurShort = (v) => {
    const a = Math.abs(v);
    if (a >= 1_000_000) return '€ ' + (v / 1_000_000).toFixed(2).replace('.', ',') + ' M';
    if (a >= 1_000)     return '€ ' + Math.round(v / 1000) + ' k';
    return '€ ' + v;
  };
  const pct = (v) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' %';

  // ============================================================
  // DATA
  // ============================================================

  const PERIODS = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

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
    const f = DEPT_SEASONALITY[dept.id];
    const sum = f.reduce((a, b) => a + b, 0);
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

  const ASSOCIATES = [
    'Albers', 'Bachmann', 'Cremer', 'Dornstetter', 'Eckert', 'Frenzel',
    'Gerlach', 'Hofbauer', 'Imhoff', 'Jelinek', 'Kraus', 'Lambrecht',
    'Mendel', 'Neuhaus', 'Ostermann'
  ];

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

  // Partner-in-charge per top clients (used for table column)
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
    const base = c.revenue / 12;
    const growth = c.newOrders / 100 / 11;
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

  // ============================================================
  // STATE & CACHE
  // ============================================================
  const state = {
    deptFilter: null,
    partnerFilter: null,
    clientSort: { key: 'revenue', dir: 'desc' },
    clientSearch: '',
    clientIndustry: '',
    clientCountry: '',
  };

  const charts = {};

  function getOrInit(id, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return null;
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
    const ch = getOrInit('cockpitTrend');
    if (!ch) return;
    const umsatz = [9.2, 9.6, 10.3, 10.8, 11.1, 11.6, 12.1, 11.8, 12.4, 13.0, 13.6, 14.3];
    const kosten = [4.2, 4.4, 4.5, 4.7, 4.8, 4.9, 5.0, 4.9, 5.1, 5.3, 5.4, 5.6];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 10, right: 10, top: 16, bottom: 24, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'axis',
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">${params[0].axisValue} 2026</div>`;
          params.forEach(p => {
            s += `<div style="display:flex;justify-content:space-between;gap:14px;color:${C.muted};font-size:11px;">
                    <span>${p.marker}${p.seriesName}</span>
                    <span style="color:${C.text};">€ ${p.value.toLocaleString('de-DE', {minimumFractionDigits:1,maximumFractionDigits:1})} M</span>
                  </div>`;
          });
          return s;
        }
      },
      xAxis: {
        type: 'category', data: PERIODS, boundaryGap: false,
        axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false },
        axisLabel: { color: C.muted, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, fontSize: 10, formatter: (v) => v + ' M' }
      },
      series: [
        {
          name: 'Umsatz', type: 'line', smooth: true, symbol: 'none',
          data: umsatz,
          lineStyle: { width: 2.5, color: C.goldBright },
          areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(201,169,97,0.35)' }, { offset: 1, color: 'rgba(201,169,97,0.0)' }] }
          }
        },
        {
          name: 'Personalkosten', type: 'line', smooth: true, symbol: 'none',
          data: kosten,
          lineStyle: { width: 1.8, color: C.navy, type: 'dashed' }
        }
      ]
    });
  }

  function renderCockpitDept() {
    const ch = getOrInit('cockpitDept');
    if (!ch) return;
    const palette = ['#C9A961', '#E0BE6D', '#8E7430', '#2D5092', '#4A78C7'];
    ch.setOption({
      ...baseOpts(),
      tooltip: {
        ...baseOpts().tooltip,
        formatter: (p) => `<div style="font-weight:600;color:${C.text};">${p.name}</div>
                           <div style="color:${C.muted};font-size:11px;margin-top:2px;">${eurShort(p.value)} · ${p.percent}%</div>`
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie',
        radius: ['58%', '78%'], center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        data: DEPARTMENTS.map((d, i) => ({ name: d.name, value: d.umsatz, itemStyle: { color: palette[i] } }))
      }]
    });
  }

  // ============================================================
  // 03 / ABTEILUNGEN
  // ============================================================
  function visibleDepartments() {
    return state.deptFilter ? DEPARTMENTS.filter(d => d.id === state.deptFilter) : DEPARTMENTS;
  }

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
    const chip = document.getElementById('abtFilterChip');
    if (!chip) return;
    if (!state.deptFilter) { chip.textContent = 'Alle Abteilungen'; return; }
    const d = DEPARTMENTS.find(x => x.id === state.deptFilter);
    chip.textContent = d ? d.name : 'Alle Abteilungen';
  }

  function renderAbtBar() {
    const ch = getOrInit('abtBar'); if (!ch) return;
    const f = state.deptFilter;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 16, top: 24, bottom: 28, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach(p => {
            s += `<div style="display:flex;justify-content:space-between;gap:14px;color:${C.muted};font-size:11px;">
                    <span>${p.marker}${p.seriesName}</span>
                    <span style="color:${C.text};">${eurShort(p.value)}</span>
                  </div>`;
          });
          return s;
        }
      },
      xAxis: {
        type: 'category', data: DEPARTMENTS.map(d => d.name),
        axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false },
        axisLabel: { color: C.muted, fontSize: 11 }
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000) + ' M' : (v / 1000) + ' k' }
      },
      series: [
        {
          name: 'Umsatz', type: 'bar', barWidth: 18,
          data: DEPARTMENTS.map(d => ({
            value: d.umsatz,
            itemStyle: { color: !f || f === d.id ? C.gold : 'rgba(201,169,97,0.2)', borderRadius: [4, 4, 0, 0] }
          }))
        },
        {
          name: 'Personalkosten', type: 'bar', barWidth: 18,
          data: DEPARTMENTS.map(d => ({
            value: d.kosten,
            itemStyle: { color: !f || f === d.id ? C.navy : 'rgba(45,80,146,0.25)', borderRadius: [4, 4, 0, 0] }
          }))
        }
      ]
    });

    ch.off('click');
    ch.on('click', (p) => {
      const dept = DEPARTMENTS.find(d => d.name === p.name);
      if (!dept) return;
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
      tooltip: {
        ...baseOpts().tooltip,
        formatter: (p) => `<div style="font-weight:600;color:${C.text};">${p.name}</div>
                           <div style="color:${C.muted};font-size:11px;margin-top:2px;">${p.value.toLocaleString('de-DE')} h · ${p.percent}%</div>`
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['58%', '78%'], center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        data: DEPARTMENTS.map((d, i) => ({
          name: d.name, value: d.stunden,
          itemStyle: { color: !f || f === d.id ? palette[i] : 'rgba(255,255,255,0.08)' }
        }))
      }]
    });
    ch.off('click');
    ch.on('click', (p) => {
      const dept = DEPARTMENTS.find(d => d.name === p.name);
      if (!dept) return;
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
      grid: { left: 12, right: 16, top: 24, bottom: 38, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip, trigger: 'axis',
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">${params[0].axisValue} 2026</div>`;
          let tot = 0;
          params.forEach(p => { tot += p.value; s += `<div style="display:flex;justify-content:space-between;gap:14px;color:${C.muted};font-size:11px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">${eurShort(p.value)}</span></div>`; });
          s += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:14px;"><span style="color:${C.muted};font-size:11px;">Gesamt</span><span style="color:${C.goldBright};font-weight:600;font-size:11px;">${eurShort(tot)}</span></div>`;
          return s;
        }
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      xAxis: {
        type: 'category', boundaryGap: false, data: PERIODS,
        axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false },
        axisLabel: { color: C.muted, fontSize: 11 }
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' }
      },
      series: depts.map(d => ({
        name: d.name, type: 'line', stack: 'total', smooth: true, symbol: 'none',
        data: monthlyRevenue(d),
        lineStyle: { width: 1.5, color: palette[d.id] },
        areaStyle: { opacity: 0.55, color: palette[d.id] }
      }))
    });
  }

  function renderAbtHighlights() {
    const ul = document.getElementById('abtHighlights'); if (!ul) return;
    const items = state.deptFilter ? (() => {
      const d = DEPARTMENTS.find(x => x.id === state.deptFilter);
      const m = monthlyRevenue(d);
      const best = m.indexOf(Math.max(...m));
      return [
        { tone: 'note', text: `<strong>${d.name}</strong>: ${eurShort(d.umsatz)} Umsatz, ${d.headcount} Mitarbeiter.` },
        { tone: 'up',   text: `Stärkster Monat: <strong>${PERIODS[best]}</strong> mit ${eurShort(m[best])}.` },
        { tone: 'note', text: `${d.stunden.toLocaleString('de-DE')} h · Umsatz/Std. € ${Math.round(d.umsatz / d.stunden)}.` },
        { tone: 'note', text: `Marge nach Personal: <strong>${pct((d.umsatz - d.kosten) / d.umsatz * 100)}</strong>.` },
      ];
    })() : [
      { tone: 'up',   text: '<strong>Patente</strong> macht 55 % vom Kanzleiumsatz, drittes Wachstumsquartal in Folge.' },
      { tone: 'down', text: '<strong>Verwaltung</strong>: 16 % der Stunden, 6 % vom Umsatz — Effizienz-Hebel.' },
      { tone: 'up',   text: '<strong>Litigation</strong> mit höchster Marge (61 %) — Kapazität ausgereizt.' },
      { tone: 'note', text: '<strong>Marken</strong> stabil und planbar — Brot und Butter.' },
    ];
    ul.innerHTML = items.map(it => {
      const dot = it.tone === 'up' ? `<span class="up">▲</span>` : it.tone === 'down' ? `<span class="down">▼</span>` : `<span class="text-gold-300">◆</span>`;
      return `<li class="flex gap-2.5"><span class="mt-0.5">${dot}</span><span class="text-slate-300">${it.text}</span></li>`;
    }).join('');
  }

  function refreshAbteilungen() {
    updateAbtKPIs();
    updateAbtFilterChip();
    renderAbtBar();
    renderAbtDonut();
    renderAbtArea();
    renderAbtHighlights();
  }

  // ============================================================
  // 04 / ANWALTS-MATRIX
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
      tooltip: {
        ...baseOpts().tooltip, trigger: 'item',
        formatter: (p) => p.dataType === 'edge'
          ? `<div style="color:${C.text};font-weight:600;">${p.data.source} → ${p.data.target}</div><div style="color:${C.muted};font-size:11px;margin-top:2px;">${p.value.toLocaleString('de-DE')} Std. / Quartal</div>`
          : `<div style="color:${C.text};font-weight:600;">${p.name}</div>`
      },
      series: [{
        type: 'sankey', left: 8, right: 110, top: 10, bottom: 10,
        nodeWidth: 14, nodeGap: 6, layoutIterations: 24, emphasis: { focus: 'adjacency' },
        data: nodes, links: links,
        label: { color: C.muted, fontSize: 11, fontFamily: 'Inter' },
        lineStyle: { color: 'source' }
      }]
    });
    ch.off('click');
    ch.on('click', (p) => {
      if (p.dataType !== 'node') return;
      const partner = PARTNERS.find(x => x.name === p.name);
      if (!partner) return;
      state.partnerFilter = (state.partnerFilter === partner.id) ? null : partner.id;
      refreshAnwaelte();
    });
  }

  function renderAnwBar() {
    const ch = getOrInit('anwBar'); if (!ch) return;
    const data = [...TOP_BILLERS].sort((a, b) => a.value - b.value);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 32, top: 10, bottom: 16, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const row = data.find(d => d.name === p.name);
          return `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;">${row.role}</div><div style="color:${C.goldBright};font-weight:600;margin-top:2px;">${eurShort(p.value)}</div>`;
        }
      },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 10, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' } },
      yAxis: { type: 'category', data: data.map(d => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 11 } },
      series: [{
        type: 'bar', barWidth: 12,
        data: data.map(d => ({ value: d.value, itemStyle: { color: d.role === 'Partner' ? C.gold : C.navy, borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: C.muted, fontSize: 10, formatter: (p) => eurShort(p.value) }
      }]
    });
  }

  function renderAnwScatter() {
    const ch = getOrInit('anwScatter'); if (!ch) return;
    const partners   = ANW_SCATTER.filter(x => x.role === 'Partner').map(x => [x.util, x.real, x.name]);
    const associates = ANW_SCATTER.filter(x => x.role === 'Associate').map(x => [x.util, x.real, x.name]);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 36, right: 18, top: 14, bottom: 38, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'item', formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.value[2]}</div><div style="color:${C.muted};font-size:11px;margin-top:2px;">Auslastung ${p.value[0]} % · Realization ${p.value[1]} %</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 } },
      xAxis: { name: 'Auslastung (%)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: C.muted, fontSize: 11 }, min: 60, max: 100, axisLine: { lineStyle: { color: C.axis } }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted } },
      yAxis: { name: 'Realization (%)', nameLocation: 'middle', nameGap: 36, nameTextStyle: { color: C.muted, fontSize: 11 }, min: 70, max: 100, axisLine: { lineStyle: { color: C.axis } }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted } },
      series: [
        { name: 'Partner',   type: 'scatter', symbolSize: 14, data: partners,   itemStyle: { color: C.gold, opacity: 0.9, borderColor: 'rgba(255,255,255,0.2)' } },
        { name: 'Associate', type: 'scatter', symbolSize: 11, data: associates, itemStyle: { color: C.navy, opacity: 0.85, borderColor: 'rgba(255,255,255,0.2)' } },
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
        { tone: 'note', text: `<strong>${p.name}</strong> erhält ${total.toLocaleString('de-DE')} Junior-Std./Quartal.` },
        { tone: 'up',   text: `Top-Zuarbeiter: <strong>${flows[0].a}</strong> (${flows[0].h} h), <strong>${flows[1].a}</strong> (${flows[1].h} h).` },
        { tone: 'note', text: `Zuarbeiter insgesamt: ${flows.length}.` },
      ];
    })() : [
      { tone: 'up',   text: '<strong>Mertens</strong>: höchste Auslastung (95 %), niedrigste Realization (78 %) — viele nicht abrechenbare Stunden.' },
      { tone: 'note', text: '<strong>Hofbauer</strong>: 96 % Auslastung — Belastungsgrenze.' },
      { tone: 'up',   text: '<strong>Kraus</strong> &amp; <strong>Bachmann</strong>: effizienteste Associates.' },
      { tone: 'down', text: '<strong>Eckert</strong>: 70 % Auslastung — Kapazität für Neugeschäft.' },
    ];
    ul.innerHTML = items.map(it => {
      const dot = it.tone === 'up' ? `<span class="up">▲</span>` : it.tone === 'down' ? `<span class="down">▼</span>` : `<span class="text-gold-300">◆</span>`;
      return `<li class="flex gap-2.5"><span class="mt-0.5">${dot}</span><span class="text-slate-300">${it.text}</span></li>`;
    }).join('');
  }

  function refreshAnwaelte() {
    updatePartnerFilterChip();
    renderAnwSankey();
    renderAnwBar();
    renderAnwScatter();
    renderAnwHighlights();
  }

  // ============================================================
  // 05 / ANWALTS-PROFIL (Hofbauer)
  // ============================================================
  function renderProfHours() {
    const ch = getOrInit('profHours'); if (!ch) return;
    const billable    = [142, 138, 156, 148, 162, 167, 110, 95, 158, 172, 168, 0];
    const nonBillable = [22, 26, 18, 24, 16, 14, 38, 42, 18, 12, 14, 0];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 16, top: 14, bottom: 38, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">${params[0].axisValue}</div>`;
          let tot = 0;
          params.forEach(p => { tot += p.value; s += `<div style="display:flex;justify-content:space-between;gap:14px;color:${C.muted};font-size:11px;"><span>${p.marker}${p.seriesName}</span><span style="color:${C.text};">${p.value} h</span></div>`; });
          s += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:14px;"><span style="color:${C.muted};font-size:11px;">Gesamt</span><span style="color:${C.goldBright};font-weight:600;font-size:11px;">${tot} h</span></div>`;
          return s;
        }
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 } },
      xAxis: { type: 'category', data: PERIODS, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, formatter: (v) => v + ' h' } },
      series: [
        { name: 'Billable', type: 'bar', stack: 'h', data: billable, barWidth: 16, itemStyle: { color: C.gold, borderRadius: [0, 0, 0, 0] } },
        { name: 'Nicht-billable', type: 'bar', stack: 'h', data: nonBillable, barWidth: 16, itemStyle: { color: 'rgba(45,80,146,0.7)', borderRadius: [4, 4, 0, 0] } }
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
      tooltip: { ...baseOpts().tooltip, formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:2px;">${p.value} h · ${p.percent}%</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['58%', '78%'], center: ['50%', '45%'],
        avoidLabelOverlap: true, itemStyle: { borderColor: C.navyDark, borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: palette[i] } }))
      }]
    });
  }

  // ============================================================
  // 06 / MANDANTEN-LISTE
  // ============================================================
  function trendArrow(n) {
    if (n > 8)  return `<span class="up">▲ +${n} %</span>`;
    if (n < -3) return `<span class="down">▼ ${n} %</span>`;
    return `<span class="text-slate-400">▬ ${n > 0 ? '+' : ''}${n} %</span>`;
  }

  function sparklineSVG(data) {
    const w = 100, h = 24, p = 2;
    const min = Math.min(...data), max = Math.max(...data);
    const span = (max - min) || 1;
    const stepX = (w - p * 2) / (data.length - 1);
    const pts = data.map((v, i) => [p + i * stepX, h - p - ((v - min) / span) * (h - p * 2)]);
    const d = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ');
    const slope = pts[pts.length - 1][1] - pts[0][1];
    const color = slope < -2 ? '#5EE6A0' : slope > 2 ? '#FF8FA3' : '#C9A961';
    const fillD = d + ` L${pts[pts.length - 1][0].toFixed(1)},${h - p} L${pts[0][0].toFixed(1)},${h - p} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
              <path d="${fillD}" fill="${color}" opacity="0.12"/>
              <path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
  }

  function filteredClients() {
    const q = state.clientSearch.toLowerCase().trim();
    const ind = state.clientIndustry, ctr = state.clientCountry;
    return CLIENTS.filter(c => {
      if (ind && c.industry !== ind) return false;
      if (ctr && c.country  !== ctr) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function sortedClients() {
    const arr = filteredClients().slice();
    const { key, dir } = state.clientSort;
    const factor = dir === 'asc' ? 1 : -1;
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
        <td class="px-4 py-2.5 text-slate-100">${c.name}</td>
        <td class="px-4 py-2.5 text-slate-300">${c.industry}</td>
        <td class="px-4 py-2.5 text-slate-300">${c.country}</td>
        <td class="px-4 py-2.5 text-slate-300">${c.partner}</td>
        <td class="px-4 py-2.5 text-right text-slate-100 font-medium">${eurShort(c.revenue)}</td>
        <td class="px-4 py-2.5 text-right ${c.margin >= 55 ? 'text-gold-200' : 'text-slate-300'}">${c.margin} %</td>
        <td class="px-4 py-2.5 text-right">${trendArrow(c.newOrders)}</td>
        <td class="px-4 py-2.5">${sparklineSVG(c.trend)}</td>
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
  // 07 / MANDANTEN-DETAIL (Helios Pharma)
  // ============================================================
  function renderClientLine() {
    const ch = getOrInit('cltLine'); if (!ch) return;
    // 24 months synthetic
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
      grid: { left: 12, right: 16, top: 16, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', formatter: (p) => `<div style="color:${C.muted};font-size:11px;">${p[0].axisValue}</div><div style="color:${C.text};font-weight:600;">${eurShort(p[0].value)}</div>` },
      xAxis: { type: 'category', data: months, boundaryGap: false, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10, interval: 2 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 10, formatter: (v) => v >= 1000 ? (v / 1000).toFixed(0) + ' k' : v } },
      series: [{
        type: 'line', smooth: true, symbol: 'none', data,
        lineStyle: { width: 2.5, color: C.goldBright },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(201,169,97,0.4)' }, { offset: 1, color: 'rgba(201,169,97,0)' }] } }
      }]
    });
  }

  function renderClientSH() {
    const ch = getOrInit('cltSH'); if (!ch) return;
    ch.setOption({
      ...baseOpts(),
      grid: { left: 0, right: 8, top: 10, bottom: 24, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('') },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['Haben (Rechnungen)', 'Soll (Eingänge)'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 11 } },
      series: [
        { name: 'Betrag', type: 'bar', data: [612400, 568200], barWidth: 18,
          itemStyle: { color: (p) => p.dataIndex === 0 ? C.gold : C.success, borderRadius: [4, 4, 4, 4] },
          label: { show: true, position: 'insideRight', color: C.text, fontSize: 10, formatter: (p) => eurShort(p.value) } },
      ]
    });
  }

  function renderClientAging() {
    const ch = getOrInit('cltAging'); if (!ch) return;
    const buckets = [
      { name: 'aktuell', value: 18400, color: C.success },
      { name: '0–30 d',  value: 22100, color: C.gold },
      { name: '31–60 d', value: 14000, color: C.amber },
      { name: '61–90 d', value:  3700, color: C.danger },
      { name: '> 90 d',  value:     0, color: '#7B1F2A' },
    ];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 0, right: 8, top: 18, bottom: 8, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('') },
      legend: { show: false },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['Forderungen'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 11 } },
      series: buckets.map((b, i) => ({
        name: b.name, type: 'bar', stack: 'a', data: [b.value], barWidth: 22,
        itemStyle: { color: b.color, borderRadius: i === 0 ? [4, 0, 0, 4] : i === buckets.length - 1 ? [0, 4, 4, 0] : 0 },
        label: { show: b.value > 2500, position: 'inside', color: '#0A1628', fontWeight: 600, fontSize: 10, formatter: () => b.name }
      }))
    });
  }

  // ============================================================
  // 08 / WELT
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
        if (i >= urls.length) return reject(new Error('No world map source available'));
        fetch(urls[i])
          .then(r => { if (!r.ok) throw new Error('fetch fail'); return r.json(); })
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
        tooltip: {
          ...baseOpts().tooltip, trigger: 'item',
          formatter: (p) => {
            if (p.seriesType === 'scatter') {
              const yoy = p.data.yoy;
              const yoyTxt = yoy >= 0 ? `<span style="color:${C.success}">+${yoy} %</span>` : `<span style="color:${C.danger}">${yoy} %</span>`;
              return `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:2px;">Umsatz: ${eurShort(p.value[2])}</div><div style="color:${C.muted};font-size:11px;">YoY: ${yoyTxt}</div>`;
            }
            return p.name;
          }
        },
        geo: { map: 'world', roam: false, silent: true, left: 0, right: 0, top: 8, bottom: 8, itemStyle: { areaColor: 'rgba(45,80,146,0.22)', borderColor: 'rgba(201,169,97,0.18)' }, emphasis: { disabled: true } },
        series: [{
          name: 'Umsatz', type: 'scatter', coordinateSystem: 'geo',
          symbolSize: (val) => Math.max(6, Math.sqrt(val[2] / maxRev) * 42),
          itemStyle: {
            color: (p) => { const y = p.data.yoy; if (y >= 20) return '#5EE6A0'; if (y >= 8) return C.goldBright; if (y >= 0) return C.gold; return '#FF8FA3'; },
            opacity: 0.85, borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1, shadowBlur: 14, shadowColor: 'rgba(201,169,97,0.45)'
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
    const top = [...WORLD_DATA].sort((a, b) => a.revenue - b.revenue).slice(-12);
    ch.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 36, top: 10, bottom: 16, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => { const c = top.find(t => t.de === params[0].name); const yoyTxt = c.yoy >= 0 ? `<span style="color:${C.success};">+${c.yoy} %</span>` : `<span style="color:${C.danger};">${c.yoy} %</span>`;
          return `<div style="color:${C.text};font-weight:600;">${c.de}</div><div style="color:${C.muted};font-size:11px;margin-top:2px;">Umsatz: ${eurShort(c.revenue)}</div><div style="color:${C.muted};font-size:11px;">YoY: ${yoyTxt}</div>`; } },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 10, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' } },
      yAxis: { type: 'category', data: top.map(t => t.de), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 11 } },
      series: [{
        type: 'bar', barWidth: 12,
        data: top.map(t => ({ value: t.revenue, itemStyle: { color: t.yoy >= 20 ? '#5EE6A0' : t.yoy >= 0 ? C.gold : '#FF8FA3', borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: C.muted, fontSize: 10, formatter: (p) => eurShort(p.value) }
      }]
    });
  }

  // ============================================================
  // 09 / PIPELINE
  // ============================================================
  function renderPipeTrend() {
    const ch = getOrInit('pipeTrend'); if (!ch) return;
    const months = ['Jul','Aug','Sep','Okt','Nov','Dez','Jan','Feb','Mrz','Apr','Mai','Jun'];
    const newClients = [3, 2, 4, 5, 4, 6, 5, 4, 7, 6, 5, 7];
    const newMatters = [12, 9, 14, 18, 16, 22, 19, 17, 23, 21, 18, 24];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 12, top: 16, bottom: 38, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 } },
      xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 11 } },
      yAxis: [
        { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted } },
        { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: C.muted } }
      ],
      series: [
        { name: 'Neue Aufträge', type: 'bar',  data: newMatters, barWidth: 18, itemStyle: { color: 'rgba(45,80,146,0.65)', borderRadius: [4, 4, 0, 0] } },
        { name: 'Neue Mandanten', type: 'line', yAxisIndex: 1, data: newClients, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.5, color: C.goldBright }, itemStyle: { color: C.goldBright } }
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
      tooltip: { ...baseOpts().tooltip, formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.name}</div><div style="color:${C.muted};font-size:11px;margin-top:2px;">${p.value} Anfragen · ${p.percent}%</div>` },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['58%', '78%'], center: ['50%', '45%'],
        avoidLabelOverlap: true, itemStyle: { borderColor: C.navyDark, borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
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
          <div class="text-sm text-slate-200">${f.name}</div>
          <div class="h-7 rounded-md overflow-hidden bg-ink-800/60 border border-white/5">
            <div class="h-full" style="width:${w}%; background:${color};"></div>
          </div>
          <div class="text-right text-sm text-slate-300 font-mono">${f.count} · ${eurShort(f.value)}</div>
          <div class="text-right text-xs text-slate-400">${conv}</div>
        </div>
      `;
    }).join('') + `
      <div class="funnel-row text-[10px] uppercase tracking-wider text-slate-500 pt-2 border-t border-white/5 mt-2">
        <div>Stufe</div><div>Volumen</div><div class="text-right">Anzahl · Wert</div><div class="text-right">Konversion</div>
      </div>
    `;
  }

  // ============================================================
  // 10 / BUCHUNGS-STREAM
  // ============================================================
  function renderStreamFlow() {
    const ch = getOrInit('streamFlow'); if (!ch) return;
    const days = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
    // Synthetic debit/credit per day
    const debit  = days.map((_, i) => -Math.round(20000 + Math.sin(i / 2) * 9000 + Math.random() * 6000));
    const credit = days.map((_, i) =>  Math.round(28000 + Math.cos(i / 3) * 12000 + Math.random() * 7000));
    ch.setOption({
      ...baseOpts(),
      grid: { left: 8, right: 8, top: 16, bottom: 28, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">Tag ${params[0].axisValue}</div>` +
          params.map(p => `<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('')
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 9, interval: 4 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 9, formatter: (v) => v / 1000 + ' k' } },
      series: [
        { name: 'Haben (Erlös)',  type: 'bar', data: credit, stack: 's', barWidth: 8, itemStyle: { color: C.gold } },
        { name: 'Soll (Aufwand)', type: 'bar', data: debit,  stack: 's', barWidth: 8, itemStyle: { color: 'rgba(255,143,163,0.7)' } }
      ]
    });
  }

  function renderOpsAging() {
    const ch = getOrInit('opsAging'); if (!ch) return;
    const buckets = [
      { name: '0–30 d',  value: 312_000, color: C.success },
      { name: '31–60 d', value: 168_000, color: C.gold },
      { name: '61–90 d', value:  74_000, color: C.amber },
      { name: '> 90 d',  value:  41_000, color: C.danger },
    ];
    ch.setOption({
      ...baseOpts(),
      grid: { left: 0, right: 8, top: 18, bottom: 8, containLabel: true },
      tooltip: { ...baseOpts().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span><span style="color:${C.text};font-size:11px;">${eurShort(p.value)}</span></div>`).join('') },
      legend: { show: false },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: ['OPOS'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 11 } },
      series: buckets.map((b, i) => ({
        name: b.name, type: 'bar', stack: 'a', data: [b.value], barWidth: 22,
        itemStyle: { color: b.color, borderRadius: i === 0 ? [4, 0, 0, 4] : i === buckets.length - 1 ? [0, 4, 4, 0] : 0 },
        label: { show: true, position: 'inside', color: '#0A1628', fontWeight: 600, fontSize: 10, formatter: () => b.name }
      }))
    });
  }

  // ============================================================
  // SCROLLSPY (Side index)
  // ============================================================
  function setupScrollspy() {
    const links = Array.from(document.querySelectorAll('#sideNav .side-link'));
    const sections = links.map(l => document.getElementById(l.dataset.target)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !sections.length) {
      links[0]?.classList.add('active');
      return;
    }
    const setActive = (id) => {
      links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
    };
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
    renderCockpitTrend();
    renderCockpitDept();

    // 03 Abteilungen
    document.getElementById('abtFilterClear')?.addEventListener('click', () => { state.deptFilter = null; refreshAbteilungen(); });
    refreshAbteilungen();

    // 04 Anwälte
    document.getElementById('partnerFilterClear')?.addEventListener('click', () => { state.partnerFilter = null; refreshAnwaelte(); });
    refreshAnwaelte();

    // 05 Profil
    renderProfHours();
    renderProfClients();

    // 06 Mandanten-Liste
    setupMandantenControls();
    renderClientsTable();

    // 07 Mandanten-Detail
    renderClientLine();
    renderClientSH();
    renderClientAging();

    // 08 Welt
    document.getElementById('worldRetry')?.addEventListener('click', (e) => { e.preventDefault(); worldMapRegistered = false; renderWorldMap(); });
    renderWorldMap();
    renderWorldBar();

    // 09 Pipeline
    renderPipeTrend();
    renderPipeSource();
    renderPipeFunnel();

    // 10 Buchungs-Stream
    renderStreamFlow();
    renderOpsAging();

    // Side index scrollspy
    setupScrollspy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
