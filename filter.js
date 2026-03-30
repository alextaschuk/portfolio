(function () {
  'use strict';

  var container = document.getElementById('cards-container');

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                'Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatDate(iso) {
    if (!iso) return '?';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }

  var LANG_COLORS = ['#6f7cff','#E63946','#A89B6B','#8ad6a2','#7A9BA8','#e08060','#8B6B7A','#5B8C85','#7fc0db'];

  var COMMIT_COLORS = {
    'feat':'#6f7cff','feature':'#6f7cff',
    'fix':'#E63946','bugfix':'#E63946',
    'docs':'#8ad6a2','doc':'#8ad6a2',
    'refactor':'#7fc0db','chore':'#7fc0db',
    'test':'#A89B6B',
    'perf':'#e08060','performance':'#e08060',
    'config':'#8B6B7A','unknown':'#555'
  };

  var COMMIT_NAMES = {
    'feat':'Feat','feature':'Feat',
    'fix':'Fix','bugfix':'Fix',
    'docs':'Docs','doc':'Docs',
    'refactor':'Refactor','chore':'Chore',
    'test':'Test','perf':'Perf','performance':'Perf',
    'config':'Config','unknown':'Other'
  };

  function computeDuration(start, end) {
    if (!start) return null;
    var s = new Date(start);
    var e = end ? new Date(end) : new Date();
    if (isNaN(s.getTime())) return null;
    var months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (months < 1) return '< 1 month';
    if (months === 1) return '1 month';
    if (months < 12) return months + ' months';
    var yrs = Math.round(months / 12 * 10) / 10;
    return yrs + (yrs === 1 ? ' year' : ' years');
  }

  function displayLang(key) {
    return key.replace(/^CodingLanguage\./i, '');
  }

  // ---- Render all cards on load ----
  function renderCards(cards) {
    container.innerHTML = '';
    cards.forEach(function (card) {
      container.appendChild(buildCardEl(card));
    });
  }

  function getImageSrc(b64) {
    if (b64.startsWith('/9j/')) return 'data:image/jpeg;base64,' + b64;
    if (b64.startsWith('iVBOR')) return 'data:image/png;base64,' + b64;
    if (b64.startsWith('R0lG')) return 'data:image/gif;base64,' + b64;
    if (b64.startsWith('UklG')) return 'data:image/webp;base64,' + b64;
    return 'data:image/jpeg;base64,' + b64;
  }

  function buildCardEl(card) {
    var el = document.createElement('div');
    el.className = 'project-card' + (card.is_showcase ? ' showcase' : '');
    el.dataset.name      = (card.project_name || '').toLowerCase();
    el.dataset.themes    = (card.themes || []).join(',').toLowerCase();
    el.dataset.tones     = (card.tones || '').toLowerCase();
    el.dataset.tags      = (card.tags_override || card.tags || []).join(',').toLowerCase();
    el.dataset.skills    = (card.skills || []).join(',').toLowerCase();
    el.dataset.frameworks = (card.frameworks || []).join(',').toLowerCase();

    var html = '';

    // Image
    if (card.image_data) {
      html += '<img class="card-image" src="' + getImageSrc(card.image_data) + '" alt="' + esc(card.project_name) + '" />';
    }

    // Name
    html += '<div class="card-name">' + esc(card.title_override || card.project_name) + '</div>';

    // Dates
    if (card.start_date || card.end_date) {
      html += '<div class="card-dates">' +
        formatDate(card.start_date) +
        ' — ' +
        (card.end_date ? formatDate(card.end_date) : 'present') +
        '</div>';
    }

    // Summary
    var summary = card.summary_override || card.summary || '';
    if (summary) {
      html += '<div class="card-summary">' + esc(summary) + '</div>';
    }

    // Themes
    if (card.themes && card.themes.length) {
      html += '<div class="card-badges">' +
        card.themes.map(function(t){ return '<span class="badge theme">' + esc(t) + '</span>'; }).join('') +
        '</div>';
    }

    // Tone
    if (card.tones) {
      html += '<div class="card-badges"><span class="badge tone">' + esc(card.tones) + '</span></div>';
    }

    // Tags
    var tags = card.tags_override || card.tags || [];
    if (tags.length) {
      html += '<div class="card-badges">' +
        tags.map(function(t){ return '<span class="badge tag">' + esc(t) + '</span>'; }).join('') +
        '</div>';
    }

    // Skills
    if (card.skills && card.skills.length) {
      html += '<div class="card-badges">' +
        card.skills.map(function(s){ return '<span class="badge skill">' + esc(s) + '</span>'; }).join('') +
        '</div>';
    }

    // Frameworks
    if (card.frameworks && card.frameworks.length) {
      html += '<div class="card-badges">' +
        card.frameworks.map(function(f){ return '<span class="badge framework">' + esc(f) + '</span>'; }).join('') +
        '</div>';
    }

    // ---- Details section (stats, language, activity, contribution) ----
    html += '<div class="card-details">';

    // Stats strip
    html += '<div class="card-stats">';
    var dur = computeDuration(card.start_date, card.end_date);
    if (dur) html += '<div class="stat-box"><div class="stat-label">Duration</div><div class="stat-value">' + esc(dur) + '</div></div>';
    if (card.total_lines != null) html += '<div class="stat-box"><div class="stat-label">Lines of Code</div><div class="stat-value">' + Number(card.total_lines).toLocaleString() + '</div></div>';
    if (card.contributors != null) html += '<div class="stat-box"><div class="stat-label">Contributors</div><div class="stat-value">' + esc(String(card.contributors)) + '</div></div>';
    if (card.work_pattern) html += '<div class="stat-box"><div class="stat-label">Work Pattern</div><div class="stat-value">' + esc(card.work_pattern) + '</div></div>';
    html += '</div>';

    // Language Breakdown
    if (card.languages && Object.keys(card.languages).length) {
      var langKeys = Object.keys(card.languages).sort(function(a,b){return card.languages[b]-card.languages[a];}).slice(0,6);
      var langTotal = langKeys.reduce(function(s,k){return s+card.languages[k];},0);
      if (langTotal > 0) {
        html += '<div class="card-section-title">Language Breakdown</div>';
        html += '<div class="lang-stacked">';
        langKeys.forEach(function(k,i){
          var pct=(card.languages[k]/langTotal*100).toFixed(1);
          var c=LANG_COLORS[i%LANG_COLORS.length];
          html+='<div style="width:'+pct+'%;background:'+c+';height:100%;" title="'+esc(displayLang(k))+' '+pct+'%"></div>';
        });
        html += '</div><div class="lang-legend">';
        langKeys.forEach(function(k,i){
          var pct=(card.languages[k]/langTotal*100).toFixed(1);
          var c=LANG_COLORS[i%LANG_COLORS.length];
          html+='<div class="lang-legend-item"><div style="width:8px;height:8px;border-radius:2px;background:'+c+';flex-shrink:0;"></div><span>'+esc(displayLang(k))+'</span><span>'+pct+'%</span></div>';
        });
        html += '</div>';
      }
    }

    // Activity Breakdown
    if (card.commit_type_distribution && Object.keys(card.commit_type_distribution).length) {
      var ctEntries = Object.keys(card.commit_type_distribution)
        .map(function(k){return{key:k,val:card.commit_type_distribution[k]};})
        .sort(function(a,b){return b.val-a.val;})
        .slice(0,6);
      if (ctEntries.length) {
        html += '<div class="card-section-title">Activity Breakdown</div>';
        ctEntries.forEach(function(e){
          var lk=e.key.toLowerCase();
          var name=COMMIT_NAMES[lk]||e.key;
          var c=COMMIT_COLORS[lk]||'#6f7cff';
          var pct=Math.round(e.val);
          html+='<div class="activity-row"><span class="activity-label">'+esc(name)+'</span>'+
            '<div class="activity-track"><div class="activity-fill" style="width:'+Math.min(100,pct)+'%;background:'+c+';"></div></div>'+
            '<span class="activity-pct">'+pct+'%</span></div>';
        });
      }
    }

    html += '</div>'; // end .card-details

    // Meta: role + group project
    var meta = [];
    if (card.collaboration_role) meta.push(card.collaboration_role);
    if (card.is_group_project) meta.push('Group project');
    if (meta.length) {
      html += '<div class="card-meta">' + meta.map(esc).join(' · ') + '</div>';
    }

    // GitHub link (only present if repo is public)
    if (card.repo_url) {
      html += '<a class="github-link" href="' + esc(card.repo_url) + '" target="_blank" rel="noopener noreferrer">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink:0">' +
        '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38' +
        ' 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52' +
        '-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2' +
        '-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82' +
        '.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12' +
        '.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01' +
        ' 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>' +
        '</svg>' +
        'View on GitHub</a>';
    }

    el.innerHTML = html;
    return el;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---- Filter logic ----
  function applyFilters() {
    var search   = document.getElementById('search-input').value.toLowerCase().trim();
    var fThemes  = document.getElementById('filter-themes').value.toLowerCase().trim();
    var fTones   = document.getElementById('filter-tones').value.toLowerCase().trim();
    var fTags    = document.getElementById('filter-tags').value.toLowerCase().trim();
    var fSkills  = document.getElementById('filter-skills').value.toLowerCase().trim();

    var cards = container.querySelectorAll('.project-card');
    cards.forEach(function (card) {
      var show = true;

      if (search) {
        show = show && (
          card.dataset.name.includes(search) ||
          card.dataset.tags.includes(search) ||
          card.dataset.skills.includes(search) ||
          card.dataset.frameworks.includes(search)
        );
      }

      if (fThemes) {
        var terms = fThemes.split(',').map(function(t){ return t.trim(); }).filter(Boolean);
        show = show && terms.some(function(t){ return card.dataset.themes.includes(t); });
      }

      if (fTones) {
        show = show && card.dataset.tones.includes(fTones);
      }

      if (fTags) {
        var terms = fTags.split(',').map(function(t){ return t.trim(); }).filter(Boolean);
        show = show && terms.some(function(t){ return card.dataset.tags.includes(t); });
      }

      if (fSkills) {
        var terms = fSkills.split(',').map(function(t){ return t.trim(); }).filter(Boolean);
        show = show && terms.some(function(t){ return card.dataset.skills.includes(t); });
      }

      card.classList.toggle('hidden', !show);
    });
  }

  // ---- Wire up events ----
  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('filter-themes').addEventListener('input', applyFilters);
  document.getElementById('filter-tones').addEventListener('input', applyFilters);
  document.getElementById('filter-tags').addEventListener('input', applyFilters);
  document.getElementById('filter-skills').addEventListener('input', applyFilters);

  document.getElementById('clear-filters').addEventListener('click', function () {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-themes').value = '';
    document.getElementById('filter-tones').value = '';
    document.getElementById('filter-tags').value = '';
    document.getElementById('filter-skills').value = '';
    applyFilters();
  });

  // ---- Initial render ----
  if (typeof PORTFOLIO_DATA !== 'undefined') {
    renderCards(PORTFOLIO_DATA.project_cards || []);
  }
}());
