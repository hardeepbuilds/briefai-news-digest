
    // ── Config ────────────────────────────────────────────────
    const API_KEY = '712bad0bfdce456c8434f6dc9e5f50ac';

    const TOPIC_MAP = {
      all:        'general',
      technology: 'technology',
      world:      'general',
      science:    'science',
      business:   'business',
      sports:     'sports',
      health:     'health',
    };

    const TOPIC_ICONS = {
      technology: '🤖', world: '🌏', science: '🧬',
      business: '📈', sports: '🏅', health: '💊', general: '📰'
    };

    const TOPIC_PILL = {
      technology: 'pill-tech', world: 'pill-world', science: 'pill-science',
      business: 'pill-business', sports: 'pill-sports', health: 'pill-health'
    };

    const TOPIC_BG = {
      technology: 'linear-gradient(135deg,#EEF3FF,#D8E8FF)',
      world:      'linear-gradient(135deg,#FFF3E8,#FFE0C0)',
      science:    'linear-gradient(135deg,#EDFAF3,#C8F0DC)',
      business:   'linear-gradient(135deg,#F4F0FF,#E0D4FF)',
      sports:     'linear-gradient(135deg,#FEF0F0,#FFD4D0)',
      health:     'linear-gradient(135deg,#FFF8EC,#FFE8B0)',
    };

    // ── Date ──────────────────────────────────────────────────
    const dateEl = document.getElementById('today-date');
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    // ── Dark mode ─────────────────────────────────────────────
    const themeBtn = document.getElementById('theme-toggle');
    let dark = false;
    themeBtn.addEventListener('click', () => {
      dark = !dark;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
      themeBtn.textContent = dark ? '☀️' : '🌙';
    });

    // ── Filter buttons ────────────────────────────────────────
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchNews(btn.dataset.topic);
      });
    });

    // ── Build a single card HTML ──────────────────────────────
    function buildCard(article, topic, index) {
      const topicKey  = topic === 'all' ? 'general' : topic;
      const pill      = TOPIC_PILL[topicKey] || 'pill-tech';
      const icon      = TOPIC_ICONS[topicKey] || '📰';
      const bg        = TOPIC_BG[topicKey]   || TOPIC_BG.technology;
      const label     = topicKey.charAt(0).toUpperCase() + topicKey.slice(1);
      const source    = article.source?.name || 'Unknown';
      const title     = article.title?.replace(' - ' + source, '') || 'No title';
      const url       = article.url || '#';
      const featured  = index === 0 ? 'featured' : '';

      const timeAgo = (() => {
        if (!article.publishedAt) return '';
        const diff = Math.floor((Date.now() - new Date(article.publishedAt)) / 60000);
        if (diff < 60)   return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
        return `${Math.floor(diff/1440)}d ago`;
      })();

      return `
        <article class="news-card ${featured}" data-topic="${topicKey}">
          <div class="card-image-placeholder" style="background:${bg}">
            <span class="card-topic-pill ${pill}">${label}</span>
            <span class="img-icon">${icon}</span>
          </div>
          <div class="card-body">
            <div class="card-source-row">
              <span class="card-source">${source}</span>
              <span class="card-time">${timeAgo}</span>
            </div>
            <h2 class="card-title">${title}</h2>
            <div class="card-summary skeleton" id="summary-${index}">
              <p class="card-summary-label">✦ AI Summary</p>
              <div class="summary-text">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
            <div class="card-footer">
              <a href="${url}" target="_blank" rel="noopener" class="read-link">Read full article →</a>
              <button class="save-btn" aria-label="Save article">♡</button>
            </div>
          </div>
        </article>`;
    }

    // ── Fetch from NewsAPI ────────────────────────────────────
    async function fetchNews(topic = 'all') {
      const grid    = document.getElementById('card-grid');
      const countEl = document.getElementById('article-count');
      const category = TOPIC_MAP[topic] || 'general';

      // Show loading skeletons
      grid.innerHTML = Array(6).fill(`
        <article class="news-card" style="min-height:320px">
          <div class="card-image-placeholder" style="background:var(--paper)"></div>
          <div class="card-body" style="gap:12px">
            <div class="skeleton-line" style="width:40%;height:10px;border-radius:4px"></div>
            <div class="skeleton-line" style="height:16px;border-radius:4px"></div>
            <div class="skeleton-line" style="height:16px;border-radius:4px;width:80%"></div>
            <div class="skeleton-line short" style="height:10px;border-radius:4px;width:30%"></div>
          </div>
        </article>`).join('');

      try {
        const query = category === 'general' ? 'india OR world OR latest' : category;
        const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=6&apiKey=${API_KEY}`;
        const res  = await fetch(url);
        const data = await res.json();

        if (data.status !== 'ok' || !data.articles?.length) {
          grid.innerHTML = `<div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No articles found for this topic.<br>Try another category.</p>
          </div>`;
          countEl.textContent = '0 articles';
          return;
        }

        const articles = data.articles.filter(a => a.title && a.title !== '[Removed]');
        grid.innerHTML  = articles.map((a, i) => buildCard(a, topic, i)).join('');
        countEl.textContent = `${articles.length} article${articles.length !== 1 ? 's' : ''}`;

        // Save button logic (re-bind after DOM update)
        document.querySelectorAll('.save-btn').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            btn.classList.toggle('saved');
            btn.textContent = btn.classList.contains('saved') ? '♥' : '♡';
          });
        });

      } catch (err) {
        grid.innerHTML = `<div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p>Could not load news. Check your internet connection.</p>
        </div>`;
      }
    }

    // ── Init ─────────────────────────────────────────────────
    fetchNews('all');