(function () {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (typeof PORTFOLIO_DATA === 'undefined') return;

  var figures  = PORTFOLIO_DATA.figures || {};
  var contrib  = figures.contribution || {};
  var personal = contrib.personal_timeline  || {};
  var totalTL  = contrib.total_timeline     || {};
  var skillAct = figures.skill_timeline || {};
  var langBreakdown = figures.language_breakdown || {};

  var hasContrib = Object.keys(personal).length > 0 || Object.keys(totalTL).length > 0;
  var hasSkill   = Object.keys(skillAct).length > 0;
  var hasLangs   = Object.keys(langBreakdown).length > 0;

  if (!hasContrib && !hasSkill && !hasLangs) {
    var fig = document.getElementById('figures');
    if (fig) fig.style.display = 'none';
    return;
  }

  if (hasLangs) {
    var lbEl = document.getElementById('language-breakdown');
    if (lbEl) buildLanguageDonut(lbEl, langBreakdown);
  }
  if (hasContrib) {
    var cmEl = document.getElementById('contribution-map');
    if (cmEl) buildContributionMap(cmEl, personal, totalTL);
  }
  if (hasSkill) {
    var stEl = document.getElementById('skill-timeline');
    if (stEl) buildSkillTimeline(stEl, skillAct);
  }

  // ==========================================================
  // Language Breakdown Donut
  // ==========================================================
  function buildLanguageDonut(el, langs) {
    var LANG_COLORS = {
      'Python':     '#3572A5', 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
      'Java':       '#b07219', 'C++':        '#f34b7d', 'C':          '#555555',
      'C#':         '#178600', 'PHP':        '#4F5D95', 'Ruby':       '#701516',
      'Swift':      '#F05138', 'Go':         '#00ADD8', 'Rust':       '#DEA584',
      'HTML':       '#e34c26', 'CSS':        '#563d7c', 'SQL':        '#e38c00',
      'Shell':      '#89e051', 'R':          '#198CE7'
    };
    var FALLBACK_COLORS = ['#6EC4E8','#ff7c6f','#7cff9a','#ffd06f','#c06fff','#6fecff','#ff6fb8','#a8ff6f'];

    var entries = Object.keys(langs).map(function(k){ return {lang:k, ratio:langs[k]}; });
    var total = entries.reduce(function(s,e){ return s+e.ratio; }, 0);
    if (total === 0) return;

    var segments = entries.map(function(e, i) {
      return {
        lang:  e.lang,
        ratio: e.ratio,
        color: LANG_COLORS[e.lang] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        pct:   (e.ratio / total) * 100
      };
    });

    // Build conic-gradient stops
    var cum = 0;
    var stops = segments.map(function(s) {
      var start = cum;
      cum += s.pct;
      return s.color + ' ' + start.toFixed(2) + '% ' + cum.toFixed(2) + '%';
    });

    el.className = 'figure-card';

    var hdr = el.appendChild(document.createElement('div'));
    hdr.style.cssText = 'margin-bottom:16px;';
    var hTitle = hdr.appendChild(document.createElement('h3'));
    hTitle.textContent = 'Language Breakdown';
    hTitle.style.cssText = 'margin:0;font-size:1rem;font-weight:600;color:#111111;';

    var wrap = el.appendChild(document.createElement('div'));
    wrap.className = 'lang-donut-wrap';

    // Donut chart
    var chartDiv = wrap.appendChild(document.createElement('div'));
    chartDiv.className = 'lang-donut-chart';

    var circle = chartDiv.appendChild(document.createElement('div'));
    circle.className = 'lang-donut-circle';
    circle.style.background = 'conic-gradient(' + stops.join(', ') + ')';

    var inner = chartDiv.appendChild(document.createElement('div'));
    inner.className = 'lang-donut-inner';
    inner.textContent = entries.length + ' lang' + (entries.length !== 1 ? 's' : '');

    // Legend
    var legend = wrap.appendChild(document.createElement('div'));
    legend.className = 'lang-donut-legend';
    segments.forEach(function(s) {
      var item = legend.appendChild(document.createElement('div'));
      item.className = 'lang-donut-legend-item';

      var swatch = item.appendChild(document.createElement('div'));
      swatch.className = 'lang-donut-swatch';
      swatch.style.background = s.color;

      var name = item.appendChild(document.createElement('span'));
      name.className = 'lang-donut-name';
      name.textContent = s.lang;

      var pct = item.appendChild(document.createElement('span'));
      pct.className = 'lang-donut-pct';
      pct.textContent = s.pct.toFixed(1) + '%';
    });
  }

  // ==========================================================
  // ContributionMap
  // ==========================================================
  function buildContributionMap(el, personal, total) {
    var ACCENT = '#002145';
    var ML = ['January','February','March','April','May','June',
              'July','August','September','October','November','December'];

    // Collect available years from data
    var yrs = {};
    [].concat(Object.keys(personal), Object.keys(total)).forEach(function (d) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) yrs[d.slice(0, 4)] = true;
    });
    var sortedYears = Object.keys(yrs).sort();
    if (!sortedYears.length) return;

    var yIdx = sortedYears.length - 1;
    var mode = 'personal';

    // Build DOM skeleton
    el.className = 'figure-card';

    var hdr = el.appendChild(document.createElement('div'));
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;';

    var hTitle = hdr.appendChild(document.createElement('h3'));
    hTitle.textContent = 'Contribution Map';
    hTitle.style.cssText = 'margin:0;font-size:18px;font-weight:600;';

    var btnRow = hdr.appendChild(document.createElement('div'));
    btnRow.style.cssText = 'display:flex;gap:8px;';

    function mkBtn(label, active) {
      var b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'padding:6px 10px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ' + ACCENT + ';transition:all 0.2s;';
      b.style.background = active ? ACCENT : 'transparent';
      b.style.color      = active ? '#fff' : ACCENT;
      return b;
    }
    var btnP = btnRow.appendChild(mkBtn('Personal', true));
    var btnR = btnRow.appendChild(mkBtn('Ratio View', false));

    var desc = el.appendChild(document.createElement('p'));
    desc.style.cssText = 'margin:0 0 12px;font-size:12px;color:#888;';

    var grid = el.appendChild(document.createElement('div'));
    grid.style.cssText = 'display:flex;gap:3px;overflow-x:auto;padding-bottom:8px;min-height:90px;';

    // Footer: legend + year nav
    var foot = el.appendChild(document.createElement('div'));
    foot.style.cssText = 'margin-top:16px;padding-top:12px;border-top:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#888;flex-wrap:wrap;gap:8px;';

    var leg = foot.appendChild(document.createElement('div'));
    leg.style.cssText = 'display:flex;align-items:center;gap:8px;';
    leg.innerHTML = '<span>Less</span>' +
      [0, 0.25, 0.5, 0.75, 1].map(function (op) {
        var bg = op === 0 ? '#e8e8e8' : 'rgba(0,33,69,' + op + ')';
        return '<div style="width:10px;height:10px;border-radius:2px;background:' + bg + ';display:inline-block;margin:0 1px;"></div>';
      }).join('') +
      '<span>More</span>';

    var ynav = foot.appendChild(document.createElement('div'));
    ynav.style.cssText = 'display:flex;align-items:center;gap:6px;';

    var prevBtn = ynav.appendChild(document.createElement('button'));
    prevBtn.innerHTML = '\u2190';
    var yearLbl = ynav.appendChild(document.createElement('span'));
    yearLbl.style.cssText = 'min-width:50px;text-align:center;font-size:11px;font-weight:600;color:' + ACCENT + ';';
    var nextBtn = ynav.appendChild(document.createElement('button'));
    nextBtn.innerHTML = '\u2192';
    [prevBtn, nextBtn].forEach(function (b) {
      b.style.cssText = 'padding:4px 8px;background:transparent;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
    });

    var tooltip = document.body.appendChild(document.createElement('div'));
    tooltip.style.cssText = 'position:fixed;pointer-events:none;display:none;background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px;font-size:12px;color:' + ACCENT + ';z-index:1000;box-shadow:0 4px 16px rgba(0,0,0,0.12);white-space:nowrap;';

    function draw() {
      var yr = sortedYears[yIdx];
      yearLbl.textContent = yr;

      var canPrev = yIdx > 0, canNext = yIdx < sortedYears.length - 1;
      prevBtn.disabled = !canPrev;
      nextBtn.disabled = !canNext;
      prevBtn.style.border = '1px solid ' + (canPrev ? ACCENT : '#444');
      prevBtn.style.color  = canPrev ? ACCENT : '#555';
      nextBtn.style.border = '1px solid ' + (canNext ? ACCENT : '#444');
      nextBtn.style.color  = canNext ? ACCENT : '#555';

      desc.textContent = mode === 'personal'
        ? 'Contribution activity as a function of commits'
        : 'Your activity as a percentage of total team contributions';

      // Generate dates for this year
      var dates = [];
      var cur = new Date(Date.UTC(+yr, 0, 1));
      var end = new Date(Date.UTC(+yr, 11, 31));
      while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      // Normalisation values
      var maxP = 1;
      dates.forEach(function (d) { if ((personal[d] || 0) > maxP) maxP = personal[d]; });
      var maxR = 0.1;
      if (mode === 'ratio') {
        dates.forEach(function (d) {
          var u = personal[d] || 0, t = total[d] || 0;
          if (t > 0 && u > 0) { var r = u / t; if (r > maxR) maxR = r; }
        });
      }

      // Group into Sunday-start weeks
      var weeks = [], wk = [];
      dates.forEach(function (d) {
        if (new Date(d + 'T12:00:00Z').getUTCDay() === 0 && wk.length) { weeks.push(wk); wk = []; }
        wk.push(d);
      });
      if (wk.length) weeks.push(wk);

      grid.innerHTML = '';
      weeks.forEach(function (week) {
        var col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex-shrink:0;';
        week.forEach(function (d) {
          var u = personal[d] || 0, t = total[d] || 0;
          var opacity = 0;
          if (mode === 'personal') {
            opacity = u > 0 ? Math.max(0.1, u / maxP) : 0;
          } else {
            if (u > 0 && t > 0) opacity = Math.max(0.1, (u / t) / maxR);
          }
          var bg = opacity === 0 ? '#e8e8e8' : 'rgba(0,33,69,' + opacity.toFixed(3) + ')';
          var sq = document.createElement('div');
          sq.style.cssText = 'width:11px;height:11px;border-radius:2px;background:' + bg + ';flex-shrink:0;cursor:default;';
          if (u > 0) {
            var dateObj = new Date(d + 'T12:00:00Z');
            var lbl = ML[dateObj.getUTCMonth()] + ' ' + dateObj.getUTCDate() + ', ' + dateObj.getUTCFullYear() +
              ': ' + u + ' commit' + (u !== 1 ? 's' : '');
            if (mode === 'ratio' && t > 0) lbl += ' (' + Math.round(u / t * 100) + '% of team)';
            (function (lbl) {
              sq.addEventListener('mouseenter', function (e) { tooltip.textContent = lbl; tooltip.style.display = 'block'; tooltip.style.left = (e.clientX + 14) + 'px'; tooltip.style.top = (e.clientY + 14) + 'px'; });
              sq.addEventListener('mousemove', function (e) { tooltip.style.left = (e.clientX + 14) + 'px'; tooltip.style.top = (e.clientY + 14) + 'px'; });
              sq.addEventListener('mouseleave', function () { tooltip.style.display = 'none'; });
            }(lbl));
          }
          col.appendChild(sq);
        });
        grid.appendChild(col);
      });
    }

    btnP.addEventListener('click', function () {
      mode = 'personal';
      btnP.style.background = ACCENT; btnP.style.color = '#fff';
      btnR.style.background = 'transparent'; btnR.style.color = ACCENT;
      draw();
    });
    btnR.addEventListener('click', function () {
      mode = 'ratio';
      btnR.style.background = ACCENT; btnR.style.color = '#fff';
      btnP.style.background = 'transparent'; btnP.style.color = ACCENT;
      draw();
    });
    prevBtn.addEventListener('click', function () { if (yIdx > 0) { yIdx--; draw(); } });
    nextBtn.addEventListener('click', function () { if (yIdx < sortedYears.length - 1) { yIdx++; draw(); } });

    draw();
  }

  // ==========================================================
  // SkillTimelineGraph
  // ==========================================================
  function buildSkillTimeline(el, skillAct) {
    var COLORS = ['#0055B7','#0891b2','#d97706','#65a30d','#be185d',
                  '#0f766e','#ea580c','#4f46e5','#b45309','#7c3aed'];
    var MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // 1. Aggregate into monthly counts
    var monthly = {}, totals = {}, minD = null, maxD = null;
    Object.keys(skillAct).forEach(function (skill) {
      var byDate = skillAct[skill] || {};
      Object.keys(byDate).forEach(function (ds) {
        var cnt = +(byDate[ds]) || 0;
        if (cnt <= 0) return;
        var d = new Date(ds);
        if (isNaN(d.getTime())) return;
        if (!minD || d < minD) minD = new Date(d);
        if (!maxD || d > maxD) maxD = new Date(d);
        var mk = ds.slice(0, 7);
        if (!monthly[skill]) monthly[skill] = {};
        monthly[skill][mk] = (monthly[skill][mk] || 0) + cnt;
        totals[skill] = (totals[skill] || 0) + cnt;
      });
    });

    var skills = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });
    if (!skills.length || !minD || !maxD) return;

    // 2. Month buckets
    var buckets = [];
    var cur = new Date(minD.getFullYear(), minD.getMonth(), 1);
    var endM = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    while (cur <= endM) {
      var yr4 = cur.getFullYear(), mo = cur.getMonth();
      var mk = yr4 + '-' + String(mo + 1).padStart(2, '0');
      buckets.push({
        key:   mk,
        short: MS[mo] + " '" + String(yr4).slice(2),
        full:  MS[mo] + ' ' + yr4
      });
      cur.setMonth(mo + 1);
    }

    // 3. Cumulative series
    var cumul = {}, gMax = 1;
    skills.forEach(function (s) {
      var run = 0;
      cumul[s] = buckets.map(function (b) { run += (monthly[s] && monthly[s][b.key]) || 0; return run; });
      var last = cumul[s][buckets.length - 1] || 0;
      if (last > gMax) gMax = last;
    });

    var mode = 'stacked';

    // Build wrapper DOM
    el.className = 'figure-card';

    var hdr = el.appendChild(document.createElement('div'));
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:12px;flex-wrap:wrap;';

    var hTitle = hdr.appendChild(document.createElement('h3'));
    hTitle.textContent = 'Most Utilized Skills';
    hTitle.style.cssText = 'margin:0;font-size:18px;font-weight:600;';

    var tgl = hdr.appendChild(document.createElement('div'));
    var btnS = tgl.appendChild(document.createElement('button'));
    btnS.textContent = 'Stacked';
    btnS.style.cssText = 'padding:4px 12px;font-size:12px;border-radius:6px 0 0 6px;border:1px solid #d0d0d0;background:#002145;color:#ffffff;cursor:pointer;font-weight:600;';
    var btnI = tgl.appendChild(document.createElement('button'));
    btnI.textContent = 'Individual';
    btnI.style.cssText = 'padding:4px 12px;font-size:12px;border-radius:0 6px 6px 0;border:1px solid #d0d0d0;border-left:none;background:transparent;color:#666;cursor:pointer;';

    var subDesc = el.appendChild(document.createElement('p'));
    subDesc.textContent = 'Cumulative running total of skill occurrences across all projects.';
    subDesc.style.cssText = 'margin:0 0 12px;font-size:12px;color:#999;';

    var chartArea = el.appendChild(document.createElement('div'));

    // ---- Shared helpers ----
    function ticks(len) {
      if (len <= 1) return [0];
      if (len <= 6) { var r = []; for (var i = 0; i < len; i++) r.push(i); return r; }
      var step = (len - 1) / 5, s = {};
      s[0] = s[len - 1] = true;
      for (var t = 1; t < 5; t++) s[Math.round(step * t)] = true;
      return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
    }

    // ---- Stacked view ----
    function renderStacked() {
      var vis = skills.filter(function (s) { return (totals[s] || 0) >= 10; });
      if (!vis.length) {
        chartArea.innerHTML = '<p style="color:#999;padding:20px;text-align:center;">Not enough data (≥10 occurrences required per skill).</p>';
        return;
      }
      var n = buckets.length;
      var W = 760, H = 380, L = 8, R = 8, T = 12, B = 30;
      var CW = W - L - R, CH = H - T - B;

      var gmI = Math.max.apply(null, vis.map(function (s) { return cumul[s][n - 1] || 0; }).concat([1]));
      function ln(v) { return Math.log(1 + v) / Math.log(1 + gmI); }

      // Log-stacked series
      var ls = [];
      vis.forEach(function (s, k) {
        var logS = (cumul[s] || []).map(ln);
        ls.push(k === 0 ? logS.slice() : logS.map(function (v, i) { return v + (ls[k - 1][i] || 0); }));
      });
      var tH = Math.max(1, (ls[ls.length - 1] || [])[n - 1] || 1);

      function xA(i) { return (L + (i / Math.max(1, n - 1)) * CW).toFixed(2); }
      function yA(v) { return (T + (1 - v / tH) * CH).toFixed(2); }

      // Legend
      var legHtml = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;">';
      vis.forEach(function (s, k) {
        var c = COLORS[k % COLORS.length];
        legHtml += '<div style="display:flex;align-items:center;gap:5px;">' +
          '<div style="width:10px;height:10px;border-radius:2px;background:' + c + ';flex-shrink:0;"></div>' +
          '<span style="font-size:12px;color:#333;">' + esc(s) + '</span>' +
          '<span style="font-size:11px;color:#888;">(' + (totals[s] || 0) + ')</span></div>';
      });
      legHtml += '</div>';

      var svg = ['<svg width="100%" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;">'];
      [0.25, 0.5, 0.75, 1].forEach(function (r) {
        var y = (T + CH * (1 - r)).toFixed(2);
        svg.push('<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#e8e8e8" stroke-width="1"/>');
      });
      vis.forEach(function (s, k) {
        var top = ls[k] || [], bot = k === 0 ? new Array(n).fill(0) : (ls[k - 1] || []);
        var c = COLORS[k % COLORS.length];
        var tp = top.map(function (v, i) { return (i ? 'L' : 'M') + ' ' + xA(i) + ' ' + yA(v); }).join(' ');
        var bp = bot.slice().reverse().map(function (v, ri) { return 'L ' + xA(n - 1 - ri) + ' ' + yA(v); }).join(' ');
        svg.push('<path d="' + tp + ' ' + bp + ' Z" fill="' + c + '" fill-opacity="0.75"/>');
        svg.push('<path d="' + tp + '" fill="none" stroke="' + c + '" stroke-width="1.2" stroke-opacity="0.9"/>');
      });
      ticks(n).forEach(function (i) {
        svg.push('<text x="' + xA(i) + '" y="' + (H - 6) + '" text-anchor="middle" fill="#7f7f7f" font-size="9">' + esc((buckets[i] || {}).short || '') + '</text>');
      });
      svg.push('</svg>');

      chartArea.innerHTML = legHtml + '<div style="border-radius:8px;border:1px solid #e0e0e0;background:#ffffff;padding:10px 4px 4px;">' + svg.join('') + '</div>';

      // ---- Hover tooltip for stacked chart ----
      var svgEl = chartArea.querySelector('svg');
      var wrapper = chartArea.querySelector('div');
      if (svgEl && wrapper) {
        wrapper.style.position = 'relative';
        var tip = wrapper.appendChild(document.createElement('div'));
        tip.style.cssText = 'position:absolute;pointer-events:none;display:none;background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;padding:10px 14px;font-size:12px;color:#333;z-index:10;min-width:160px;box-shadow:0 4px 16px rgba(0,0,0,0.12);';
        svgEl.style.cursor = 'crosshair';
        svgEl.addEventListener('mousemove', function(e) {
          var svgRect = svgEl.getBoundingClientRect();
          var mx = (e.clientX - svgRect.left) / svgRect.width * W;
          var idx = Math.round((mx - L) / CW * Math.max(1, n - 1));
          idx = Math.max(0, Math.min(n - 1, idx));
          var b = buckets[idx];
          if (!b) { tip.style.display = 'none'; return; }
          var tHtml = '<div style="font-weight:600;margin-bottom:7px;color:#111111;border-bottom:1px solid #e0e0e0;padding-bottom:6px;">' + esc(b.full) + '</div>';
          vis.forEach(function(s, k) {
            var c = COLORS[k % COLORS.length], cnt = cumul[s][idx] || 0;
            tHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">' +
              '<div style="width:8px;height:8px;border-radius:2px;background:' + c + ';flex-shrink:0;"></div>' +
              '<span style="flex:1;">' + esc(s) + '</span>' +
              '<span style="color:#777;min-width:30px;text-align:right;">' + cnt + '</span>' +
              '</div>';
          });
          tip.innerHTML = tHtml;
          var wrapRect = wrapper.getBoundingClientRect();
          var tx = e.clientX - wrapRect.left + 14;
          var ty = e.clientY - wrapRect.top - 20;
          if (tx + 200 > wrapRect.width) tx -= 220;
          if (ty < 0) ty = 4;
          tip.style.left = tx + 'px'; tip.style.top = ty + 'px'; tip.style.display = 'block';
        });
        svgEl.addEventListener('mouseleave', function() { tip.style.display = 'none'; });
      }
    }

    // ---- Individual (small multiples) view ----
    function renderIndividual() {
      var vis = skills.slice(0, 5).filter(function (s) { return (totals[s] || 0) > 0; });
      if (!vis.length) { chartArea.innerHTML = '<p style="color:#999;padding:20px;text-align:center;">No skill data.</p>'; return; }
      var W = 400, H = 140, LP = 10, RP = 10, TP = 12, BP = 22;
      var CW2 = W - LP - RP, CH2 = H - TP - BP;
      var n = buckets.length;
      function logS(v) { return gMax <= 1 ? v / gMax : Math.log(1 + v) / Math.log(1 + gMax); }
      function xF(i) { return (LP + (i / Math.max(1, n - 1)) * CW2).toFixed(2); }
      function yF(v) { return (TP + (1 - logS(v)) * CH2).toFixed(2); }
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:24px;padding-top:8px;">';
      vis.forEach(function (s, idx) {
        var c = COLORS[idx % COLORS.length], ser = cumul[s] || [], tot = totals[s] || 0;
        var lp = ser.map(function (v, i) { return (i ? 'L' : 'M') + ' ' + xF(i) + ' ' + yF(v); }).join(' ');
        var btm = (TP + CH2).toFixed(2);
        var ap = lp + ' L ' + xF(n - 1) + ' ' + btm + ' L ' + xF(0) + ' ' + btm + ' Z';
        var svg = ['<svg width="100%" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;">'];
        [0.25, 0.5, 0.75, 1].forEach(function (r) {
          var y = (TP + CH2 * (1 - r)).toFixed(2);
          svg.push('<line x1="' + LP + '" x2="' + (W - RP) + '" y1="' + y + '" y2="' + y + '" stroke="#e8e8e8" stroke-width="1"/>');
        });
        if (lp) {
          svg.push('<path d="' + ap + '" fill="' + c + '" fill-opacity="0.2"/>');
          svg.push('<path d="' + lp + '" fill="none" stroke="' + c + '" stroke-width="2"/>');
        }
        ser.forEach(function (v, i) {
          var lbl = ((buckets[i] || {}).full || '') + ': ' + v + ' occurrence' + (v !== 1 ? 's' : '') + ' cumulative';
          svg.push('<circle cx="' + xF(i) + '" cy="' + yF(v) + '" r="2.4" fill="' + c + '" stroke="#121212" stroke-width="0.6"><title>' + esc(lbl) + '</title></circle>');
        });
        ticks(n).forEach(function (i) {
          svg.push('<text x="' + xF(i) + '" y="' + (H - 6) + '" text-anchor="middle" fill="#7f7f7f" font-size="9">' + esc((buckets[i] || {}).short || '') + '</text>');
        });
        svg.push('</svg>');
        html += '<div style="border:1px solid #e0e0e0;border-radius:10px;background:#ffffff;padding:18px;border-top:3px solid ' + c + ';">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<div style="color:#111111;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(s) + '">' + esc(s) + '</div>' +
          '<div style="color:#777777;font-size:11px;">' + tot + ' occurrence' + (tot !== 1 ? 's' : '') + '</div></div>' +
          svg.join('') + '</div>';
      });
      html += '</div>';
      chartArea.innerHTML = html;
    }

    btnS.addEventListener('click', function () {
      mode = 'stacked';
      btnS.style.background = '#002145'; btnS.style.color = '#ffffff'; btnS.style.fontWeight = '600';
      btnI.style.background = 'transparent'; btnI.style.color = '#666'; btnI.style.fontWeight = '';
      renderStacked();
    });
    btnI.addEventListener('click', function () {
      mode = 'individual';
      btnI.style.background = '#002145'; btnI.style.color = '#ffffff'; btnI.style.fontWeight = '600';
      btnS.style.background = 'transparent'; btnS.style.color = '#666'; btnS.style.fontWeight = '';
      renderIndividual();
    });

    renderStacked();
  }

}());
