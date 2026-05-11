/* ============================================================
 * KanzleiCockpit – Demo-Logik
 * Single-file, vanilla JS. Requires ECharts global.
 * ============================================================ */

(function () {
  'use strict';

  // ----- Theme tokens -----
  const C = {
    gold:        '#C9A961',
    goldBright:  '#E0BE6D',
    goldDim:     '#8E7430',
    navy:        '#2D5092',
    navyDeep:    '#1A325A',
    navyDark:    '#0F1E36',
    text:        '#E8ECF4',
    muted:       '#9AAAC4',
    grid:        'rgba(201,169,97,0.08)',
    axis:        'rgba(154,170,196,0.4)',
    success:     '#5EE6A0',
    danger:      '#FF8FA3',
  };

  // Base options shared by every chart
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
      animationDuration: 700,
      animationEasing: 'cubicOut',
    };
  }

  // EUR formatter
  const eur = (v) => '€ ' + Number(v).toLocaleString('de-DE');
  const eurShort = (v) => {
    if (v >= 1_000_000) return '€ ' + (v / 1_000_000).toFixed(2).replace('.', ',') + ' M';
    if (v >= 1_000)     return '€ ' + Math.round(v / 1000) + ' k';
    return '€ ' + v;
  };
  const pct = (v) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' %';

  // ============================================================
  // DATA (synthetisch, plausibel, anonymisiert)
  // ============================================================

  const PERIODS = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const DEPARTMENTS = [
    { id: 'patente',     name: 'Patente',     umsatz: 7_840_000, kosten: 3_310_000, stunden: 41_200, headcount: 18 },
    { id: 'marken',      name: 'Marken',      umsatz: 2_960_000, kosten: 1_180_000, stunden: 14_800, headcount: 7  },
    { id: 'designs',     name: 'Designs',     umsatz:   810_000, kosten:   360_000, stunden:  4_600, headcount: 2  },
    { id: 'litigation',  name: 'Litigation',  umsatz: 1_840_000, kosten:   720_000, stunden:  9_200, headcount: 5  },
    { id: 'verwaltung',  name: 'Verwaltung',  umsatz:   836_000, kosten:   600_000, stunden: 12_840, headcount: 15 },
  ];

  // Monthly factors (departments scale slightly differently)
  const MONTH_PROFILE = [0.78, 0.82, 0.95, 0.88, 0.93, 1.02, 0.86, 0.74, 0.97, 1.11, 1.09, 1.21];
  const DEPT_SEASONALITY = {
    patente:    [1, 1.02, 1.05, 1.04, 1.02, 1.08, 0.92, 0.85, 1.04, 1.12, 1.10, 1.18],
    marken:     [1, 1.01, 1.03, 1.05, 1.04, 1.04, 0.95, 0.88, 1.01, 1.08, 1.06, 1.10],
    designs:    [1, 1.00, 1.04, 0.95, 0.98, 1.05, 1.10, 0.92, 1.00, 1.04, 1.02, 1.06],
    litigation: [1, 1.05, 1.10, 0.95, 0.92, 1.00, 0.85, 0.80, 1.05, 1.15, 1.18, 1.20],
    verwaltung: [1, 1.00, 1.00, 1.00, 1.00, 1.02, 1.00, 0.98, 1.00, 1.02, 1.00, 1.05],
  };

  // Synthesize monthly revenue per department, normalized so sum ≈ annual umsatz
  function monthlyRevenue(dept) {
    const factors = DEPT_SEASONALITY[dept.id];
    const sum = factors.reduce((a, b) => a + b, 0);
    return factors.map(f => Math.round(dept.umsatz * (f / sum)));
  }

  const PARTNERS = [
    { id: 'brenner',  name: 'Dr. Brenner',   dept: 'patente'    },
    { id: 'voss',     name: 'Voss',          dept: 'patente'    },
    { id: 'koehler',  name: 'Köhler',        dept: 'patente'    },
    { id: 'lange',    name: 'Dr. Lange',     dept: 'marken'     },
    { id: 'mertens',  name: 'Mertens',       dept: 'litigation' },
    { id: 'haupt',    name: 'Dr. Haupt',     dept: 'patente'    },
  ];

  const ASSOCIATES = [
    'Albers', 'Bachmann', 'Cremer', 'Dornstetter', 'Eckert', 'Frenzel',
    'Gerlach', 'Hofbauer', 'Imhoff', 'Jelinek', 'Kraus', 'Lambrecht',
    'Mendel', 'Neuhaus', 'Ostermann'
  ];

  // Hour-flow matrix: associates → partners (hours per quarter)
  // Crafted to look realistic: each associate has 1-2 primary partners.
  const ASSOC_FLOWS = [
    ['Albers',       { brenner: 280, voss: 90 }],
    ['Bachmann',     { voss: 320, koehler: 60 }],
    ['Cremer',       { brenner: 240, haupt: 130 }],
    ['Dornstetter',  { mertens: 360 }],
    ['Eckert',       { lange: 290, haupt: 60 }],
    ['Frenzel',      { koehler: 310, voss: 50 }],
    ['Gerlach',      { brenner: 200, mertens: 130 }],
    ['Hofbauer',     { haupt: 340, brenner: 40 }],
    ['Imhoff',       { lange: 260, voss: 110 }],
    ['Jelinek',      { mertens: 220, koehler: 110 }],
    ['Kraus',        { voss: 280, brenner: 60 }],
    ['Lambrecht',    { haupt: 270, lange: 90 }],
    ['Mendel',       { koehler: 250, mertens: 90 }],
    ['Neuhaus',      { brenner: 210, lange: 130 }],
    ['Ostermann',    { mertens: 290, haupt: 80 }],
  ];

  // Top biller list (rolling quarter)
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

  // Scatter: utilization vs. realization for each professional
  const ANW_SCATTER = [
    { name: 'Dr. Brenner', role: 'Partner',  util: 96, real: 93 },
    { name: 'Voss',        role: 'Partner',  util: 92, real: 91 },
    { name: 'Köhler',      role: 'Partner',  util: 88, real: 89 },
    { name: 'Dr. Lange',   role: 'Partner',  util: 84, real: 90 },
    { name: 'Mertens',     role: 'Partner',  util: 95, real: 78 }, // outlier
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

  // Mandanten (clients)
  const INDUSTRIES = ['Pharma & Biotech', 'Maschinenbau', 'Halbleiter', 'Automotive', 'Software', 'Konsumgüter', 'Chemie'];
  const COUNTRIES_FOR_CLIENTS = ['Deutschland', 'Schweiz', 'USA', 'Japan', 'Südkorea', 'UK', 'Frankreich', 'Niederlande', 'Schweden', 'Italien'];

  // Hand-crafted top 24 clients to look real
  const CLIENTS = [
    { id: 'helios',    name: 'Helios Pharma AG',          industry: 'Pharma & Biotech', country: 'Deutschland', revenue: 612_400, margin: 61, orders: 84, newOrders: 24,  rate: 410 },
    { id: 'sumire',    name: 'Sumire Robotics K.K.',      industry: 'Maschinenbau',     country: 'Japan',       revenue: 488_900, margin: 54, orders: 52, newOrders: 12,  rate: 420 },
    { id: 'meridian',  name: 'Meridian Semiconductors',   industry: 'Halbleiter',       country: 'USA',         revenue: 471_200, margin: 49, orders: 41, newOrders: 18,  rate: 460 },
    { id: 'fjordsen',  name: 'Fjordsen Energi AS',        industry: 'Chemie',           country: 'Schweden',    revenue: 408_300, margin: 58, orders: 36, newOrders: -8,  rate: 440 },
    { id: 'novexa',    name: 'NovExa Biosciences',        industry: 'Pharma & Biotech', country: 'Schweiz',     revenue: 386_700, margin: 63, orders: 47, newOrders: 31,  rate: 470 },
    { id: 'pankraz',   name: 'Pankraz Werkzeugbau GmbH',  industry: 'Maschinenbau',     country: 'Deutschland', revenue: 354_100, margin: 41, orders: 62, newOrders: -3,  rate: 360 },
    { id: 'altair',    name: 'Altair Motorsport',         industry: 'Automotive',       country: 'Italien',     revenue: 338_500, margin: 52, orders: 28, newOrders: 14,  rate: 430 },
    { id: 'kymera',    name: 'Kymera Software Ltd.',      industry: 'Software',         country: 'UK',          revenue: 312_600, margin: 67, orders: 24, newOrders: -18, rate: 480 },
    { id: 'aurelius',  name: 'Aurelius Chemie KGaA',      industry: 'Chemie',           country: 'Deutschland', revenue: 297_400, margin: 39, orders: 71, newOrders: 6,   rate: 340 },
    { id: 'hanwool',   name: 'Hanwool Display Co.',       industry: 'Halbleiter',       country: 'Südkorea',    revenue: 286_900, margin: 56, orders: 33, newOrders: 41,  rate: 450 },
    { id: 'lumenia',   name: 'Lumenia Optics SA',         industry: 'Halbleiter',       country: 'Frankreich',  revenue: 271_800, margin: 51, orders: 26, newOrders: 9,   rate: 440 },
    { id: 'kestrel',   name: 'Kestrel BioWorks',          industry: 'Pharma & Biotech', country: 'USA',         revenue: 263_200, margin: 60, orders: 22, newOrders: 27,  rate: 475 },
    { id: 'rhenus',    name: 'Rhenus Hydraulik',          industry: 'Maschinenbau',     country: 'Deutschland', revenue: 249_700, margin: 44, orders: 58, newOrders: 1,   rate: 350 },
    { id: 'tessera',   name: 'Tessera Mobility B.V.',     industry: 'Automotive',       country: 'Niederlande', revenue: 238_400, margin: 48, orders: 30, newOrders: 11,  rate: 420 },
    { id: 'oryza',     name: 'Oryza AgriTech',            industry: 'Chemie',           country: 'Japan',       revenue: 224_900, margin: 53, orders: 25, newOrders: 16,  rate: 430 },
    { id: 'praxion',   name: 'Praxion Medical',           industry: 'Pharma & Biotech', country: 'Schweiz',     revenue: 218_300, margin: 59, orders: 28, newOrders: 4,   rate: 460 },
    { id: 'velorum',   name: 'Velorum E-Mobility',        industry: 'Automotive',       country: 'Deutschland', revenue: 207_500, margin: 36, orders: 44, newOrders: 22,  rate: 360 },
    { id: 'kollath',   name: 'Kollath & Söhne GmbH',      industry: 'Konsumgüter',      country: 'Deutschland', revenue: 192_100, margin: 47, orders: 39, newOrders: -5,  rate: 350 },
    { id: 'arctica',   name: 'Arctica Materials',         industry: 'Chemie',           country: 'Schweden',    revenue: 184_900, margin: 50, orders: 21, newOrders: 8,   rate: 410 },
    { id: 'paragon',   name: 'Paragon Audio Systems',     industry: 'Konsumgüter',      country: 'USA',         revenue: 176_300, margin: 55, orders: 19, newOrders: 13,  rate: 440 },
    { id: 'metafora',  name: 'Metafora AI Labs',          industry: 'Software',         country: 'Deutschland', revenue: 168_700, margin: 64, orders: 17, newOrders: 33,  rate: 470 },
    { id: 'corvus',    name: 'Corvus Defense',            industry: 'Maschinenbau',     country: 'UK',          revenue: 161_400, margin: 42, orders: 23, newOrders: -22, rate: 380 },
    { id: 'finora',    name: 'Finora Consumer Brands',    industry: 'Konsumgüter',      country: 'Italien',     revenue: 154_200, margin: 38, orders: 35, newOrders: 2,   rate: 330 },
    { id: 'noria',     name: 'Noria Renewables',          industry: 'Chemie',           country: 'Niederlande', revenue: 148_700, margin: 51, orders: 18, newOrders: 19,  rate: 430 },
  ];

  // Add a 12-month trend per client
  function clientTrend(c) {
    // Base around c.revenue/12 with seasonality + growth tied to newOrders %
    const base = c.revenue / 12;
    const growth = c.newOrders / 100 / 11; // monthly growth share
    const noise = [-0.06, 0.04, -0.02, 0.05, -0.04, 0.03, -0.05, 0.06, -0.03, 0.04, -0.02, 0.05];
    return PERIODS.map((_, i) => Math.round(base * (1 + growth * i + noise[i])));
  }
  CLIENTS.forEach(c => { c.trend = clientTrend(c); });

  // Welt: countries with revenue
  const WORLD_DATA = [
    { name: 'Germany',        de: 'Deutschland',   coord: [10.5, 51.0],  revenue: 7_490_000, yoy:  8 },
    { name: 'United States',  de: 'USA',           coord: [-95.7, 39.0], revenue: 1_530_000, yoy: 14 },
    { name: 'Switzerland',    de: 'Schweiz',       coord: [8.2, 46.8],   revenue:   930_000, yoy: 11 },
    { name: 'Japan',          de: 'Japan',         coord: [138.3, 36.2], revenue:   860_000, yoy: 18 },
    { name: 'Korea',          de: 'Südkorea',      coord: [127.8, 36.5], revenue:   590_000, yoy: 41 },
    { name: 'United Kingdom', de: 'UK',            coord: [-1.5, 53.0],  revenue:   540_000, yoy: -12 },
    { name: 'France',         de: 'Frankreich',    coord: [2.3, 46.6],   revenue:   470_000, yoy:  5 },
    { name: 'Netherlands',    de: 'Niederlande',   coord: [5.3, 52.1],   revenue:   410_000, yoy:  9 },
    { name: 'Sweden',         de: 'Schweden',      coord: [18.6, 60.1],  revenue:   390_000, yoy:  6 },
    { name: 'Italy',          de: 'Italien',       coord: [12.5, 42.8],  revenue:   360_000, yoy:  3 },
    { name: 'Austria',        de: 'Österreich',    coord: [14.5, 47.5],  revenue:   220_000, yoy:  7 },
    { name: 'China',          de: 'China',         coord: [104.2, 35.9], revenue:   210_000, yoy: 22 },
    { name: 'Canada',         de: 'Kanada',        coord: [-106, 56],    revenue:   180_000, yoy: 10 },
    { name: 'Spain',          de: 'Spanien',       coord: [-3.7, 40.4],  revenue:   150_000, yoy:  2 },
    { name: 'Denmark',        de: 'Dänemark',      coord: [10.0, 56.2],  revenue:   140_000, yoy:  8 },
    { name: 'Singapore',      de: 'Singapur',      coord: [103.8, 1.35], revenue:   130_000, yoy: 25 },
    { name: 'Belgium',        de: 'Belgien',       coord: [4.5, 50.6],   revenue:   120_000, yoy:  4 },
    { name: 'Israel',         de: 'Israel',        coord: [34.85, 31.0], revenue:   110_000, yoy: 16 },
  ];

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    activeTab: 'abteilungen',
    deptFilter: null,       // department id
    partnerFilter: null,    // partner id
    period: 'YTD 2026',
    clientSort: { key: 'revenue', dir: 'desc' },
    clientSearch: '',
    clientIndustry: '',
    selectedClientId: 'helios',
  };

  // Chart instances cache
  const charts = {};

  function resize() {
    Object.values(charts).forEach(c => { try { c && c.resize(); } catch (e) {} });
  }
  window.addEventListener('resize', resize);

  // ============================================================
  // HERO CHART
  // ============================================================
  function renderHero() {
    const el = document.getElementById('heroChart');
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: 'svg' });
    charts.hero = chart;

    const dataLine = [9.2, 9.6, 10.3, 10.8, 11.1, 11.6, 12.1, 11.8, 12.4, 13.0, 13.6, 14.3].map(v => +v.toFixed(2));

    chart.setOption({
      ...baseOpts(),
      grid: { left: 8, right: 8, top: 10, bottom: 20, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'axis',
        formatter: (params) => {
          const p = params[0];
          return `<div style="font-size:11px;color:${C.muted};margin-bottom:4px;">${p.axisValue} 2026</div>
                  <div style="font-weight:600;color:${C.text};">€ ${p.value.toLocaleString('de-DE', {minimumFractionDigits:2,maximumFractionDigits:2})} M</div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: PERIODS,
        axisLine: { lineStyle: { color: C.axis } },
        axisLabel: { color: C.muted, fontSize: 10 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        show: false
      },
      series: [{
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: dataLine,
        lineStyle: { width: 2.5, color: C.goldBright },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(201,169,97,0.45)' },
              { offset: 1, color: 'rgba(201,169,97,0.00)' }
            ]
          }
        }
      }]
    });
  }

  // ============================================================
  // TAB: ABTEILUNGEN
  // ============================================================
  function visibleDepartments() {
    if (!state.deptFilter) return DEPARTMENTS;
    return DEPARTMENTS.filter(d => d.id === state.deptFilter);
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
    if (!state.deptFilter) { chip.textContent = 'Alle Abteilungen'; return; }
    const d = DEPARTMENTS.find(x => x.id === state.deptFilter);
    chip.textContent = d ? d.name : 'Alle Abteilungen';
  }

  function renderAbtBar() {
    const el = document.getElementById('abtBar');
    if (!el) return;
    charts.abtBar = charts.abtBar || echarts.init(el, null, { renderer: 'svg' });
    const isFiltered = !!state.deptFilter;

    charts.abtBar.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 16, top: 24, bottom: 28, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const name = params[0].axisValue;
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">${name}</div>`;
          params.forEach(p => {
            s += `<div style="display:flex;justify-content:space-between;gap:14px;color:${C.muted};font-size:11px;">
                    <span>${p.marker}${p.seriesName}</span>
                    <span style="color:${C.text};font-weight:500;">${eurShort(p.value)}</span>
                  </div>`;
          });
          return s;
        }
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: DEPARTMENTS.map(d => d.name),
        axisLine: { lineStyle: { color: C.axis } },
        axisTick: { show: false },
        axisLabel: { color: C.muted, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000) + ' M' : (v / 1000) + ' k' }
      },
      series: [
        {
          name: 'Umsatz',
          type: 'bar',
          data: DEPARTMENTS.map(d => ({
            value: d.umsatz,
            itemStyle: {
              color: (!isFiltered || state.deptFilter === d.id) ? C.gold : 'rgba(201,169,97,0.2)',
              borderRadius: [4, 4, 0, 0]
            }
          })),
          barWidth: 18,
        },
        {
          name: 'Personalkosten',
          type: 'bar',
          data: DEPARTMENTS.map(d => ({
            value: d.kosten,
            itemStyle: {
              color: (!isFiltered || state.deptFilter === d.id) ? C.navy : 'rgba(45,80,146,0.25)',
              borderRadius: [4, 4, 0, 0]
            }
          })),
          barWidth: 18,
        }
      ]
    });

    charts.abtBar.off('click');
    charts.abtBar.on('click', (params) => {
      const name = params.name;
      const dept = DEPARTMENTS.find(d => d.name === name);
      if (!dept) return;
      state.deptFilter = (state.deptFilter === dept.id) ? null : dept.id;
      refreshAbteilungen();
    });
  }

  function renderAbtDonut() {
    const el = document.getElementById('abtDonut');
    if (!el) return;
    charts.abtDonut = charts.abtDonut || echarts.init(el, null, { renderer: 'svg' });
    const palette = ['#C9A961', '#E0BE6D', '#8E7430', '#2D5092', '#4A78C7'];
    const filter = state.deptFilter;

    charts.abtDonut.setOption({
      ...baseOpts(),
      tooltip: {
        ...baseOpts().tooltip,
        formatter: (p) => `<div style="font-weight:600;color:${C.text};">${p.name}</div>
                           <div style="color:${C.muted};font-size:11px;margin-top:2px;">${p.value.toLocaleString('de-DE')} h · ${p.percent}%</div>`
      },
      legend: {
        bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10
      },
      series: [{
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: C.navyDark, borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: DEPARTMENTS.map((d, i) => ({
          name: d.name, value: d.stunden,
          itemStyle: { color: !filter || filter === d.id ? palette[i] : 'rgba(255,255,255,0.08)' }
        }))
      }]
    });

    charts.abtDonut.off('click');
    charts.abtDonut.on('click', (p) => {
      const dept = DEPARTMENTS.find(d => d.name === p.name);
      if (!dept) return;
      state.deptFilter = (state.deptFilter === dept.id) ? null : dept.id;
      refreshAbteilungen();
    });
  }

  function renderAbtArea() {
    const el = document.getElementById('abtArea');
    if (!el) return;
    charts.abtArea = charts.abtArea || echarts.init(el, null, { renderer: 'svg' });
    const filter = state.deptFilter;
    const depts = filter ? DEPARTMENTS.filter(d => d.id === filter) : DEPARTMENTS;
    const palette = { patente: '#C9A961', marken: '#E0BE6D', designs: '#8E7430', litigation: '#2D5092', verwaltung: '#4A78C7' };

    charts.abtArea.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 16, top: 24, bottom: 38, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'axis',
        formatter: (params) => {
          let s = `<div style="font-weight:600;color:${C.text};margin-bottom:4px;">${params[0].axisValue} 2026</div>`;
          let total = 0;
          params.forEach(p => {
            total += p.value;
            s += `<div style="display:flex;justify-content:space-between;gap:14px;color:${C.muted};font-size:11px;">
                    <span>${p.marker}${p.seriesName}</span>
                    <span style="color:${C.text};">${eurShort(p.value)}</span>
                  </div>`;
          });
          s += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:14px;">
                  <span style="color:${C.muted};font-size:11px;">Gesamt</span>
                  <span style="color:${C.goldBright};font-weight:600;font-size:11px;">${eurShort(total)}</span>
                </div>`;
          return s;
        }
      },
      legend: {
        bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: PERIODS,
        axisLine: { lineStyle: { color: C.axis } },
        axisTick: { show: false },
        axisLabel: { color: C.muted, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' }
      },
      series: depts.map(d => ({
        name: d.name,
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'none',
        data: monthlyRevenue(d),
        lineStyle: { width: 1.5, color: palette[d.id] },
        areaStyle: { opacity: 0.55, color: palette[d.id] }
      }))
    });
  }

  function renderAbtHighlights() {
    const ul = document.getElementById('abtHighlights');
    if (!ul) return;
    const filter = state.deptFilter;

    let items;
    if (!filter) {
      items = [
        { tone: 'up',    text: '<strong>Patente</strong> wächst zum dritten Quartal in Folge — mittlerweile 55 % vom Kanzleiumsatz.' },
        { tone: 'down',  text: '<strong>Verwaltung</strong> trägt 9 % der Stunden, aber nur 6 % vom Umsatz — Hebel für Effizienzgewinne.' },
        { tone: 'up',    text: '<strong>Litigation</strong> mit höchster Marge (61 %) — Kapazität ausbauen lohnt sich strategisch.' },
        { tone: 'note',  text: '<strong>Marken</strong> stabil und planbar — der Brot-und-Butter-Kern Ihrer Abteilungen.' },
      ];
    } else {
      const d = DEPARTMENTS.find(x => x.id === filter);
      const m = monthlyRevenue(d);
      const best = m.indexOf(Math.max(...m));
      items = [
        { tone: 'note',  text: `<strong>${d.name}</strong>: € ${(d.umsatz/1_000_000).toFixed(2)} M Umsatz, ${d.headcount} Mitarbeiter.` },
        { tone: 'up',    text: `Stärkster Monat: <strong>${PERIODS[best]}</strong> mit ${eurShort(m[best])}.` },
        { tone: 'note',  text: `Stundenleistung: ${d.stunden.toLocaleString('de-DE')} h · Umsatz/Std. ${Math.round(d.umsatz / d.stunden)} €.` },
        { tone: 'note',  text: `Marge nach Personal: <strong>${((d.umsatz - d.kosten) / d.umsatz * 100).toFixed(1)} %</strong>.` },
      ];
    }
    ul.innerHTML = items.map(it => {
      const dot = it.tone === 'up' ? `<span class="trend-up">▲</span>` : it.tone === 'down' ? `<span class="trend-down">▼</span>` : `<span class="text-gold-300">◆</span>`;
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
  // TAB: ANWÄLTE
  // ============================================================
  function updatePartnerFilterChip() {
    const chip = document.getElementById('partnerFilterChip');
    if (!state.partnerFilter) { chip.textContent = 'Alle Partner'; return; }
    const p = PARTNERS.find(x => x.id === state.partnerFilter);
    chip.textContent = p ? p.name : 'Alle Partner';
  }

  function renderAnwSankey() {
    const el = document.getElementById('anwSankey');
    if (!el) return;
    charts.anwSankey = charts.anwSankey || echarts.init(el, null, { renderer: 'svg' });

    const partnerById = Object.fromEntries(PARTNERS.map(p => [p.id, p]));
    const focus = state.partnerFilter;

    const nodes = [
      ...ASSOCIATES.map(a => ({ name: a, depth: 0, itemStyle: { color: '#2D5092' } })),
      ...PARTNERS.map(p => ({ name: p.name, depth: 1, itemStyle: { color: focus && focus !== p.id ? 'rgba(201,169,97,0.25)' : C.gold } })),
    ];

    const links = [];
    ASSOC_FLOWS.forEach(([assoc, flows]) => {
      Object.entries(flows).forEach(([pid, hours]) => {
        const partner = partnerById[pid];
        if (!partner) return;
        const dimmed = focus && focus !== pid;
        links.push({
          source: assoc, target: partner.name, value: hours,
          lineStyle: {
            color: dimmed ? 'rgba(45,80,146,0.15)' : 'rgba(201,169,97,0.45)',
            opacity: dimmed ? 0.4 : 0.85,
            curveness: 0.5,
          }
        });
      });
    });

    charts.anwSankey.setOption({
      ...baseOpts(),
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'item',
        formatter: (p) => {
          if (p.dataType === 'edge') {
            return `<div style="color:${C.text};font-weight:600;">${p.data.source} → ${p.data.target}</div>
                    <div style="color:${C.muted};font-size:11px;margin-top:2px;">${p.value.toLocaleString('de-DE')} Stunden / Quartal</div>`;
          }
          return `<div style="color:${C.text};font-weight:600;">${p.name}</div>`;
        }
      },
      series: [{
        type: 'sankey',
        left: 8, right: 110, top: 10, bottom: 10,
        nodeWidth: 14,
        nodeGap: 6,
        emphasis: { focus: 'adjacency' },
        layoutIterations: 24,
        data: nodes,
        links: links,
        label: { color: C.muted, fontSize: 11, fontFamily: 'Inter' },
        lineStyle: { color: 'source' }
      }]
    });

    charts.anwSankey.off('click');
    charts.anwSankey.on('click', (p) => {
      if (p.dataType !== 'node') return;
      const partner = PARTNERS.find(x => x.name === p.name);
      if (!partner) return;
      state.partnerFilter = (state.partnerFilter === partner.id) ? null : partner.id;
      refreshAnwaelte();
    });
  }

  function renderAnwBar() {
    const el = document.getElementById('anwBar');
    if (!el) return;
    charts.anwBar = charts.anwBar || echarts.init(el, null, { renderer: 'svg' });
    const data = [...TOP_BILLERS].sort((a, b) => a.value - b.value);

    charts.anwBar.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 32, top: 10, bottom: 16, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const row = data.find(d => d.name === p.name);
          return `<div style="color:${C.text};font-weight:600;">${p.name}</div>
                  <div style="color:${C.muted};font-size:11px;">${row.role}</div>
                  <div style="color:${C.goldBright};font-weight:600;margin-top:2px;">${eurShort(p.value)}</div>`;
        }
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, fontSize: 10, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' }
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: C.text, fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: data.map(d => ({
          value: d.value,
          itemStyle: {
            color: d.role === 'Partner' ? C.gold : C.navy,
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: 12,
        label: { show: true, position: 'right', color: C.muted, fontSize: 10, formatter: (p) => eurShort(p.value) }
      }]
    });
  }

  function renderAnwScatter() {
    const el = document.getElementById('anwScatter');
    if (!el) return;
    charts.anwScatter = charts.anwScatter || echarts.init(el, null, { renderer: 'svg' });

    const partners   = ANW_SCATTER.filter(x => x.role === 'Partner').map(x => [x.util, x.real, x.name]);
    const associates = ANW_SCATTER.filter(x => x.role === 'Associate').map(x => [x.util, x.real, x.name]);

    charts.anwScatter.setOption({
      ...baseOpts(),
      grid: { left: 36, right: 18, top: 14, bottom: 38, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'item',
        formatter: (p) => `<div style="color:${C.text};font-weight:600;">${p.value[2]}</div>
                           <div style="color:${C.muted};font-size:11px;margin-top:2px;">Auslastung ${p.value[0]} % · Realization ${p.value[1]} %</div>`
      },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 } },
      xAxis: {
        name: 'Auslastung (%)', nameLocation: 'middle', nameGap: 28,
        nameTextStyle: { color: C.muted, fontSize: 11 },
        min: 60, max: 100,
        axisLine: { lineStyle: { color: C.axis } },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted }
      },
      yAxis: {
        name: 'Realization (%)', nameLocation: 'middle', nameGap: 36,
        nameTextStyle: { color: C.muted, fontSize: 11 },
        min: 70, max: 100,
        axisLine: { lineStyle: { color: C.axis } },
        splitLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted }
      },
      series: [
        { name: 'Partner',   type: 'scatter', symbolSize: 14, data: partners,   itemStyle: { color: C.gold, opacity: 0.9, borderColor: 'rgba(255,255,255,0.2)' } },
        { name: 'Associate', type: 'scatter', symbolSize: 11, data: associates, itemStyle: { color: C.navy, opacity: 0.85, borderColor: 'rgba(255,255,255,0.2)' } },
      ]
    });
  }

  function renderAnwHighlights() {
    const ul = document.getElementById('anwHighlights');
    if (!ul) return;
    const items = state.partnerFilter ? (
      (() => {
        const p = PARTNERS.find(x => x.id === state.partnerFilter);
        const flows = ASSOC_FLOWS.filter(([a, f]) => f[p.id]).map(([a, f]) => ({ a, h: f[p.id] }));
        const total = flows.reduce((s, f) => s + f.h, 0);
        flows.sort((a, b) => b.h - a.h);
        return [
          { tone: 'note', text: `<strong>${p.name}</strong> erhält ${total.toLocaleString('de-DE')} Junior-Stunden / Quartal.` },
          { tone: 'up',   text: `Top-Zuarbeiter: <strong>${flows[0].a}</strong> (${flows[0].h} h) und <strong>${flows[1].a}</strong> (${flows[1].h} h).` },
          { tone: 'note', text: `Abteilung: ${DEPARTMENTS.find(d => d.id === p.dept).name}.` },
          { tone: 'note', text: `Zuarbeiter insgesamt: ${flows.length}.` },
        ];
      })()
    ) : [
      { tone: 'up',   text: '<strong>Mertens</strong> hat höchste Auslastung (95 %), aber niedrigste Realization (78 %) — Indikator für nicht abrechenbare Stunden.' },
      { tone: 'note', text: '<strong>Hofbauer</strong> ist mit 96 % Auslastung an der Belastungsgrenze. Backup empfehlenswert.' },
      { tone: 'up',   text: '<strong>Kraus</strong> und <strong>Bachmann</strong> sind die effizientesten Associates.' },
      { tone: 'down', text: '<strong>Eckert</strong> ist unterausgelastet (70 %) — Kapazität für Neugeschäft.' },
    ];

    ul.innerHTML = items.map(it => {
      const dot = it.tone === 'up' ? `<span class="trend-up">▲</span>` : it.tone === 'down' ? `<span class="trend-down">▼</span>` : `<span class="text-gold-300">◆</span>`;
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
  // TAB: MANDANTEN
  // ============================================================
  function trendArrow(n) {
    if (n > 8)  return `<span class="trend-up">▲ +${n} %</span>`;
    if (n < -3) return `<span class="trend-down">▼ ${n} %</span>`;
    return `<span class="text-slate-400">▬ ${n > 0 ? '+' : ''}${n} %</span>`;
  }

  function sparklineSVG(data) {
    const w = 100, h = 24, p = 2;
    const min = Math.min(...data), max = Math.max(...data);
    const span = (max - min) || 1;
    const stepX = (w - p * 2) / (data.length - 1);
    const pts = data.map((v, i) => [p + i * stepX, h - p - ((v - min) / span) * (h - p * 2)]);
    const d = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ');
    const slope = pts[pts.length - 1][1] - pts[0][1]; // y-down
    const color = slope < -2 ? '#5EE6A0' : slope > 2 ? '#FF8FA3' : '#C9A961';
    const fillD = d + ` L${pts[pts.length - 1][0].toFixed(1)},${h - p} L${pts[0][0].toFixed(1)},${h - p} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
              <path d="${fillD}" fill="${color}" opacity="0.12"/>
              <path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
  }

  function filteredClients() {
    const q = state.clientSearch.toLowerCase().trim();
    const ind = state.clientIndustry;
    return CLIENTS.filter(c => {
      if (ind && c.industry !== ind) return false;
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
    const tbody = document.getElementById('clientsTbody');
    if (!tbody) return;
    const list = sortedClients();
    tbody.innerHTML = list.map(c => `
      <tr data-id="${c.id}" class="hover:bg-gold-400/5 cursor-pointer ${state.selectedClientId === c.id ? 'bg-gold-400/10' : ''}">
        <td class="px-4 py-3 text-slate-100">${c.name}<div class="text-[10px] text-slate-500 mt-0.5">${c.country}</div></td>
        <td class="px-4 py-3 text-slate-300">${c.industry}</td>
        <td class="px-4 py-3 text-right text-slate-100 font-medium">${eurShort(c.revenue)}</td>
        <td class="px-4 py-3 text-right ${c.margin >= 55 ? 'text-gold-200' : 'text-slate-300'}">${c.margin} %</td>
        <td class="px-4 py-3 text-right">${trendArrow(c.newOrders)}</td>
        <td class="px-4 py-3">${sparklineSVG(c.trend)}</td>
      </tr>
    `).join('');

    // Header sort visuals
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = '↕';
      if (th.dataset.key === state.clientSort.key) {
        th.classList.add(state.clientSort.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        if (arrow) arrow.textContent = state.clientSort.dir === 'asc' ? '↑' : '↓';
      }
    });

    document.getElementById('clientsRowsInfo').textContent = `${list.length} Mandanten angezeigt`;

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => {
        state.selectedClientId = tr.dataset.id;
        renderClientsTable();
        renderClientDetail();
      });
    });
  }

  function renderClientDetail() {
    const c = CLIENTS.find(x => x.id === state.selectedClientId);
    if (!c) return;
    document.getElementById('clientName').textContent = c.name;
    document.getElementById('clientMeta').textContent = `${c.industry} · ${c.country}`;
    document.getElementById('clientRevenue').textContent = eurShort(c.revenue);
    document.getElementById('clientMargin').textContent  = c.margin + ' %';
    document.getElementById('clientOrders').textContent  = c.orders;
    document.getElementById('clientRate').textContent    = '€ ' + c.rate;

    // Line chart
    const lineEl = document.getElementById('clientLine');
    if (lineEl) {
      charts.clientLine = charts.clientLine || echarts.init(lineEl, null, { renderer: 'svg' });
      charts.clientLine.setOption({
        ...baseOpts(),
        grid: { left: 0, right: 4, top: 6, bottom: 18, containLabel: true },
        tooltip: {
          ...baseOpts().tooltip,
          trigger: 'axis',
          formatter: (p) => `<div style="color:${C.muted};font-size:11px;">${p[0].axisValue}</div>
                             <div style="color:${C.text};font-weight:600;">${eurShort(p[0].value)}</div>`
        },
        xAxis: { type: 'category', data: PERIODS, axisLine: { lineStyle: { color: C.axis } }, axisTick: { show: false }, axisLabel: { color: C.muted, fontSize: 10 } },
        yAxis: { type: 'value', show: false },
        series: [{
          type: 'line', smooth: true, symbol: 'none',
          data: c.trend,
          lineStyle: { width: 2, color: C.goldBright },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(201,169,97,0.45)' },
                { offset: 1, color: 'rgba(201,169,97,0.00)' }
              ]
            }
          }
        }]
      });
    }

    // Soll/Haben bar
    const shEl = document.getElementById('clientSollHaben');
    if (shEl) {
      charts.clientSH = charts.clientSH || echarts.init(shEl, null, { renderer: 'svg' });
      // Synthesize Soll/Haben: Haben = revenue (Rechnungen), Soll = revenue * (1 - 0.07 + variance)
      const variance = (c.id.length % 5) / 100;
      const haben = c.revenue;
      const soll  = Math.round(c.revenue * (1 - 0.05 + variance));
      const offen = haben - soll;
      charts.clientSH.setOption({
        ...baseOpts(),
        grid: { left: 0, right: 8, top: 10, bottom: 24, containLabel: true },
        tooltip: {
          ...baseOpts().tooltip,
          trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (params) => params.map(p => `<div style="display:flex;justify-content:space-between;gap:14px;">
              <span style="color:${C.muted};font-size:11px;">${p.marker}${p.seriesName}</span>
              <span style="color:${C.text};font-weight:500;font-size:11px;">${eurShort(p.value)}</span></div>`).join('')
        },
        legend: { show: false },
        xAxis: { type: 'value', show: false },
        yAxis: {
          type: 'category', data: ['Soll', 'Haben'],
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: C.muted, fontSize: 11 }
        },
        series: [
          {
            type: 'bar', stack: 'a', name: 'Bezahlt',
            data: [soll, haben],
            itemStyle: { color: C.gold, borderRadius: [4, 0, 0, 4] }, barWidth: 16,
            label: { show: true, color: C.text, position: 'insideRight', fontSize: 10, formatter: (p) => eurShort(p.value) }
          },
          {
            type: 'bar', stack: 'a', name: 'Offen',
            data: [offen, 0],
            itemStyle: { color: 'rgba(255,143,163,0.6)', borderRadius: [0, 4, 4, 0] }, barWidth: 16,
            label: { show: true, color: C.muted, position: 'insideRight', fontSize: 10, formatter: (p) => p.value ? eurShort(p.value) : '' }
          }
        ]
      });
    }
  }

  function setupMandantenControls() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (state.clientSort.key === key) state.clientSort.dir = state.clientSort.dir === 'asc' ? 'desc' : 'asc';
        else { state.clientSort.key = key; state.clientSort.dir = (key === 'name' || key === 'industry') ? 'asc' : 'desc'; }
        renderClientsTable();
      });
    });

    const s = document.getElementById('clientSearch');
    if (s) s.addEventListener('input', (e) => { state.clientSearch = e.target.value; renderClientsTable(); });

    const i = document.getElementById('clientIndustry');
    if (i) i.addEventListener('change', (e) => { state.clientIndustry = e.target.value; renderClientsTable(); });
  }

  function refreshMandanten() {
    renderClientsTable();
    renderClientDetail();
  }

  // ============================================================
  // TAB: WELT
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
    const el = document.getElementById('worldMap');
    const fb = document.getElementById('worldMapFallback');
    if (!el) return;

    loadWorldMap().then(() => {
      fb.classList.add('hidden');
      charts.worldMap = charts.worldMap || echarts.init(el, null, { renderer: 'canvas' });

      const maxRev = Math.max(...WORLD_DATA.map(d => d.revenue));
      const points = WORLD_DATA.map(d => ({
        name: d.de,
        value: [...d.coord, d.revenue],
        yoy: d.yoy
      }));

      charts.worldMap.setOption({
        ...baseOpts(),
        tooltip: {
          ...baseOpts().tooltip,
          trigger: 'item',
          formatter: (p) => {
            if (p.seriesType === 'scatter') {
              const yoy = p.data.yoy;
              const yoyTxt = yoy >= 0
                ? `<span style="color:${C.success}">+${yoy} %</span>`
                : `<span style="color:${C.danger}">${yoy} %</span>`;
              return `<div style="color:${C.text};font-weight:600;">${p.name}</div>
                      <div style="color:${C.muted};font-size:11px;margin-top:2px;">Umsatz: ${eurShort(p.value[2])}</div>
                      <div style="color:${C.muted};font-size:11px;">YoY: ${yoyTxt}</div>`;
            }
            return p.name;
          }
        },
        geo: {
          map: 'world',
          roam: false,
          silent: true,
          left: 0, right: 0, top: 8, bottom: 8,
          itemStyle: { areaColor: 'rgba(45,80,146,0.22)', borderColor: 'rgba(201,169,97,0.18)' },
          emphasis: { disabled: true }
        },
        series: [{
          name: 'Mandantenumsatz',
          type: 'scatter',
          coordinateSystem: 'geo',
          symbolSize: (val) => {
            const v = val[2];
            return Math.max(6, Math.sqrt(v / maxRev) * 42);
          },
          itemStyle: {
            color: (p) => {
              const yoy = p.data.yoy;
              if (yoy >= 20) return '#5EE6A0';
              if (yoy >= 8)  return C.goldBright;
              if (yoy >= 0)  return C.gold;
              return '#FF8FA3';
            },
            opacity: 0.85,
            borderColor: 'rgba(255,255,255,0.6)',
            borderWidth: 1,
            shadowBlur: 14,
            shadowColor: 'rgba(201,169,97,0.45)'
          },
          data: points,
          z: 5
        }]
      });

      // Country click -> filter chip (visual only)
      charts.worldMap.off('click');
      charts.worldMap.on('click', (p) => {
        if (p.seriesType !== 'scatter') return;
        document.getElementById('worldFilterChip').textContent = p.name;
      });
    }).catch(() => {
      fb.classList.remove('hidden');
    });
  }

  function renderWorldBar() {
    const el = document.getElementById('worldBar');
    if (!el) return;
    charts.worldBar = charts.worldBar || echarts.init(el, null, { renderer: 'svg' });
    const top = [...WORLD_DATA].sort((a, b) => a.revenue - b.revenue).slice(-12);

    charts.worldBar.setOption({
      ...baseOpts(),
      grid: { left: 12, right: 36, top: 10, bottom: 16, containLabel: true },
      tooltip: {
        ...baseOpts().tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const country = top.find(t => t.de === p.name);
          const yoy = country.yoy;
          const yoyTxt = yoy >= 0 ? `<span style="color:${C.success};">+${yoy} %</span>` : `<span style="color:${C.danger};">${yoy} %</span>`;
          return `<div style="color:${C.text};font-weight:600;">${country.de}</div>
                  <div style="color:${C.muted};font-size:11px;margin-top:2px;">Umsatz: ${eurShort(country.revenue)}</div>
                  <div style="color:${C.muted};font-size:11px;">YoY: ${yoyTxt}</div>`;
        }
      },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted, fontSize: 10, formatter: (v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : (v / 1000) + ' k' } },
      yAxis: { type: 'category', data: top.map(t => t.de), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 11 } },
      series: [{
        type: 'bar',
        data: top.map(t => ({
          value: t.revenue,
          itemStyle: {
            color: t.yoy >= 20 ? '#5EE6A0' : t.yoy >= 0 ? C.gold : '#FF8FA3',
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: 12,
        label: { show: true, position: 'right', color: C.muted, fontSize: 10, formatter: (p) => eurShort(p.value) }
      }]
    });
  }

  function refreshWelt() {
    renderWorldMap();
    renderWorldBar();
  }

  // ============================================================
  // TAB SWITCHING
  // ============================================================
  function activateTab(id) {
    state.activeTab = id;
    document.querySelectorAll('[role="tab"]').forEach(btn => {
      btn.setAttribute('aria-selected', btn.dataset.tab === id ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(p => {
      p.classList.toggle('hidden', p.dataset.panel !== id);
    });

    // Lazy-init charts and resize on activation
    if (id === 'abteilungen') refreshAbteilungen();
    if (id === 'anwaelte')    refreshAnwaelte();
    if (id === 'mandanten')   refreshMandanten();
    if (id === 'welt')        refreshWelt();

    // Force resize because hidden containers measure 0
    setTimeout(resize, 60);
  }

  function setupTabs() {
    document.querySelectorAll('[role="tab"]').forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    document.getElementById('abtFilterClear')?.addEventListener('click', () => { state.deptFilter = null; refreshAbteilungen(); });
    document.getElementById('partnerFilterClear')?.addEventListener('click', () => { state.partnerFilter = null; refreshAnwaelte(); });
    document.getElementById('worldRetry')?.addEventListener('click', (e) => { e.preventDefault(); worldMapRegistered = false; renderWorldMap(); });

    document.getElementById('periodSelect')?.addEventListener('change', (e) => {
      state.period = e.target.value;
      // Re-render currently active tab (period is a visual cue only in this demo).
      activateTab(state.activeTab);
    });
  }

  // ============================================================
  // REVEAL ON SCROLL
  // ============================================================
  function setupReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  // ============================================================
  // BOOT
  // ============================================================
  function boot() {
    renderHero();
    setupTabs();
    setupMandantenControls();
    activateTab('abteilungen');
    setupReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
