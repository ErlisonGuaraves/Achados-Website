/* =====================================================================
   Achadinhos da Carol — aplicação (HTML/CSS/JS puros, sem build)
   Uma oferta, somente visualização. Rotas em hash:
     #/  ou  #/oferta/:slug   → página da oferta
     #/termos  #/privacidade  → páginas de texto
   ===================================================================== */
(function () {
  'use strict';

  const { OFFER, STORES, ALLOWED_HOSTS, GROUP_URL } = window.CAROL;
  const main  = document.getElementById('conteudo');
  const toast = document.querySelector('[data-toast]');

  /* ---------------------------------------------------------------- utils */

  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const RTF = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function money(value) {
    return typeof value === 'number' && value > 0 ? BRL.format(value) : null;
  }

  /* Percentual arredondado. Em produção isso deve vir calculado do servidor;
     aqui derivamos do par (previous, current) e só quando os dois são válidos. */
  function discountPercent(price) {
    if (!price || !(price.previous > price.current) || !(price.current > 0)) return null;
    const pct = Math.round((1 - price.current / price.previous) * 100);
    return pct >= 5 && pct <= 95 ? pct : null;
  }

  function relativeTime(iso) {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    const diffMin = Math.round((then - Date.now()) / 60000);
    const abs = Math.abs(diffMin);
    if (abs < 60)   return RTF.format(diffMin, 'minute');
    if (abs < 1440) return RTF.format(Math.round(diffMin / 60), 'hour');
    return RTF.format(Math.round(diffMin / 1440), 'day');
  }

  /* Proteção contra redirecionamento aberto: destino precisa ser https e
     pertencer à lista de lojas permitidas. */
  function safeUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return null;
      const host = parsed.hostname.replace(/^www\./, '');
      return ALLOWED_HOSTS.indexOf(host) !== -1 ? parsed.href : null;
    } catch (_) { return null; }
  }

  function isAvailable(offer) {
    if (offer.status !== 'active') return false;
    if (offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now()) return false;
    return Boolean(safeUrl(offer.affiliateUrl));
  }

  function storeOf(offer) {
    return STORES[offer.store] || { id: offer.store, name: offer.store };
  }

  /* --------------------------------------------------------------- métricas
     Sem backend: os eventos entram em window.dataLayer e no console. Plugue
     GA4/Plausible lendo essa fila. Nenhum dado pessoal é registrado. */

  window.dataLayer = window.dataLayer || [];
  function track(event, payload) {
    const entry = Object.assign({ event: event, ts: new Date().toISOString() }, payload);
    window.dataLayer.push(entry);
    if (window.console && console.debug) console.debug('[track]', entry);
  }

  /* ----------------------------------------------------------------- toast */

  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  /* ------------------------------------------------------------------- api
     Assíncrono de propósito: no dia que virar uma API HTTP, só o corpo muda. */

  const api = {
    getOffer: function () {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(OFFER); }, 140);
      });
    }
  };

  /* -------------------------------------------------------------- metadados
     O <head> já traz o título, a descrição e a prévia da oferta, que é o que
     os robôs do WhatsApp leem (eles não executam JS). Aqui só ajustamos o que
     muda ao navegar para Termos e Privacidade. */

  function setMeta(title, description) {
    document.title = title;
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute('content', description);
  }

  /* ---------------------------------------------------------- componentes */

  /* AVIF e WebP quando o navegador aceitar, JPEG como fallback universal.
     Se nada carregar, cai no placeholder vetorial em vez de mostrar ícone quebrado. */
  function productImage(offer) {
    const sources = (offer.imageSources || []).map(function (s) {
      return '<source srcset="' + esc(s.src) + '" type="' + esc(s.type) + '">';
    }).join('');
    return '' +
      '<picture>' + sources +
        '<img src="' + esc(offer.imageUrl) + '" alt="' + esc(offer.imageAlt) + '" ' +
             'width="1000" height="1000" fetchpriority="high" decoding="async" ' +
             'onerror="this.onerror=null; this.src=\'assets/img/placeholder.svg\';">' +
      '</picture>';
  }

  function priceBlock(offer) {
    const current  = money(offer.price.current);
    const previous = money(offer.price.previous);
    const pct      = discountPercent(offer.price);
    if (!current) return '';

    const extras = [];
    if (offer.price.installments) extras.push('<li>' + esc(offer.price.installments) + '</li>');
    if (offer.shipping) {
      extras.push('<li' + (offer.shipping.conditional ? '' : ' class="is-success"') + '>' +
        esc(offer.shipping.label) +
        (offer.shipping.conditional ? ' <span class="muted">(confira as condições na loja)</span>' : '') +
        '</li>');
    }
    if (offer.stockLabel) extras.push('<li>' + esc(offer.stockLabel) + '</li>');

    return '' +
      '<div class="price">' +
        (previous && pct ? '<p class="price__previous">De <s>' + previous + '</s></p>' : '') +
        '<p class="price__row">' +
          '<span class="sr-only">Por</span>' +
          '<strong class="price__current">' + current + '</strong>' +
          (pct ? '<span class="chip chip--discount">' + pct + '% OFF</span>' : '') +
        '</p>' +
        (extras.length ? '<ul class="price__extras">' + extras.join('') + '</ul>' : '') +
      '</div>';
  }

  function couponBlock(offer) {
    if (!offer.coupon || !offer.coupon.code) return '';
    return '' +
      '<div class="coupon">' +
        '<div>' +
          '<p class="coupon__label">Cupom da loja</p>' +
          (offer.coupon.description ? '<p class="coupon__desc">' + esc(offer.coupon.description) + '</p>' : '') +
        '</div>' +
        '<button class="coupon__code" type="button" data-action="copy-coupon" data-code="' + esc(offer.coupon.code) + '">' +
          '<span>' + esc(offer.coupon.code) + '</span>' +
          '<span class="coupon__copy">Copiar</span>' +
        '</button>' +
      '</div>';
  }

  function primaryCta(offer) {
    const url = safeUrl(offer.affiliateUrl);
    if (!isAvailable(offer) || !url) {
      return '<p class="btn btn--primary is-disabled" aria-disabled="true">Oferta encerrada</p>';
    }
    return '' +
      '<a class="btn btn--primary" href="' + esc(url) + '" rel="sponsored noopener noreferrer"' +
         (isDesktop() ? ' target="_blank"' : '') + ' data-action="store-cta">' +
        'Ver oferta na ' + esc(storeOf(offer).name) +
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
          '<path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</a>';
  }

  function vipBlock() {
    return '' +
      '<div class="vip">' +
        '<p class="vip__text">' +
          '<svg class="vip__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
            '<path d="M12 3a9 9 0 00-7.7 13.7L3 21l4.4-1.3A9 9 0 1012 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
          '</svg>' +
          'Receba os melhores achados antes que acabem' +
        '</p>' +
        '<a class="btn btn--secondary" href="' + esc(GROUP_URL) + '" rel="noopener noreferrer" target="_blank" data-action="group-cta">Entrar no Grupo VIP</a>' +
      '</div>';
  }

  function disclaimer() {
    return '' +
      '<p class="disclaimer">' +
        'O preço e a disponibilidade podem mudar a qualquer momento na loja. ' +
        '<a href="#/termos">Leia os Termos</a> · <a href="#/privacidade">Privacidade</a>' +
      '</p>';
  }

  /* -------------------------------------------------------------- páginas */

  function offerSkeleton() {
    return '' +
      '<div class="wrap">' +
        '<article class="offer" aria-busy="true" aria-label="Carregando a oferta">' +
          '<div class="offer__media"><div class="media-frame sk"></div></div>' +
          '<div class="offer__decision">' +
            '<div class="sk sk--line" style="width:45%"></div>' +
            '<div class="sk sk--title"></div>' +
            '<div class="sk sk--title" style="width:70%"></div>' +
            '<div class="sk sk--price"></div>' +
            '<div class="sk sk--btn"></div>' +
            '<div class="sk sk--btn"></div>' +
          '</div>' +
        '</article>' +
      '</div>';
  }

  function renderOffer(offer) {
    const published = relativeTime(offer.publishedAt);
    const checked   = relativeTime(offer.checkedAt);
    const available = isAvailable(offer);

    main.innerHTML = '' +
      '<div class="wrap">' +
        '<article class="offer">' +
          '<div class="offer__media">' +
            '<div class="media-frame">' + productImage(offer) + '</div>' +
          '</div>' +

          '<div class="offer__decision">' +
            '<div class="meta-row">' +
              '<span class="chip chip--store"><span class="chip__dot" aria-hidden="true"></span>Oferta na ' + esc(storeOf(offer).name) + '</span>' +
              (offer.editorialNote ? '<span class="chip chip--editorial">' + esc(offer.editorialNote) + '</span>' : '') +
            '</div>' +

            '<h1 class="offer__title">' + esc(offer.title) + '</h1>' +

            (available ? '' : '<p class="notice notice--expired"><strong>Oferta encerrada.</strong> Essa oferta terminou. Entre no Grupo VIP para receber os próximos achados.</p>') +

            priceBlock(offer) +
            (available ? couponBlock(offer) : '') +

            '<div class="actions">' + primaryCta(offer) + vipBlock() + '</div>' +

            (checked ? '<p class="meta meta--check">Preço verificado ' + esc(checked) + '.</p>' : '') +
            disclaimer() +
          '</div>' +
        '</article>' +
      '</div>';

    setMeta(offer.seo.title, offer.seo.description);

    track('offer_view', {
      offer_id: offer.id,
      store: offer.store,
      category: offer.category,
      source: document.referrer ? 'referral' : 'direct'
    });
  }

  function renderDoc(title, description, body) {
    main.innerHTML = '<div class="wrap"><article class="doc"><h1>' + esc(title) + '</h1>' + body +
      '<p class="doc__back"><a href="#/">Voltar para a oferta</a></p></article></div>';
    setMeta(title + ' — Achadinhos da Carol', description);
  }

  function renderError() {
    main.innerHTML = '' +
      '<div class="wrap"><div class="empty">' +
        '<h1>Não conseguimos carregar essa página</h1>' +
        '<p>Verifique sua conexão e tente de novo.</p>' +
        '<button class="btn btn--secondary" type="button" data-action="retry">Tentar novamente</button>' +
      '</div></div>';
  }

  const TERMS_BODY =
    '<h2>Como o Achadinhos da Carol ganha dinheiro</h2>' +
    '<p>Participamos de programas de afiliados de lojas como Shopee, Mercado Livre e Amazon. Quando você ' +
    'abre uma oferta daqui e compra na loja, podemos receber uma comissão. O preço que você paga é o mesmo, ' +
    'com ou sem o nosso link.</p>' +
    '<h2>O que não fazemos</h2>' +
    '<p>Não vendemos nada, não processamos pagamento e não guardamos dados do seu cartão. A compra, a entrega, ' +
    'a troca e o suporte são responsabilidade da loja parceira.</p>' +
    '<h2>Preço e disponibilidade</h2>' +
    '<p>O preço mostrado aqui foi conferido na data indicada na oferta e pode mudar a qualquer momento na ' +
    'loja. Confira sempre o valor final na página da loja antes de comprar.</p>' +
    '<h2>Contato</h2>' +
    '<p>Fale com a gente pelo <a href="' + GROUP_URL + '" rel="noopener noreferrer" target="_blank">Grupo VIP no WhatsApp</a>.</p>';

  const PRIVACY_BODY =
    '<h2>O que medimos</h2>' +
    '<p>Contamos de forma agregada quantas pessoas viram a oferta, clicaram no botão da loja, entraram no ' +
    'grupo ou compartilharam o link. Não pedimos cadastro, não pedimos e-mail e não guardamos seu nome ou ' +
    'telefone neste site.</p>' +
    '<h2>O que fica no seu navegador</h2>' +
    '<p>Este site não usa cookies de publicidade próprios. A loja parceira pode usar cookies quando você ' +
    'chega até ela pelo nosso link — é isso que identifica a indicação.</p>' +
    '<h2>WhatsApp</h2>' +
    '<p>Ao entrar no Grupo VIP você passa a ser membro de um grupo do WhatsApp, e as regras de privacidade ' +
    'do WhatsApp se aplicam. Você pode sair do grupo a qualquer momento.</p>' +
    '<h2>Seus direitos</h2>' +
    '<p>Como não guardamos dados pessoais identificáveis neste site, não há cadastro para corrigir ou ' +
    'excluir. Dúvidas sobre dados podem ser enviadas pelo grupo.</p>';

  /* --------------------------------------------------------------- roteador */

  async function route() {
    const path = (location.hash || '#/').replace(/^#/, '');

    try {
      if (path === '/termos') {
        renderDoc('Termos de uso e aviso de afiliados',
          'Como o Achadinhos da Carol funciona, o que é comissão de afiliado e de quem é a responsabilidade pela compra.',
          TERMS_BODY);
      } else if (path === '/privacidade') {
        renderDoc('Política de privacidade',
          'O que o Achadinhos da Carol mede, o que não coleta e como trata dados.',
          PRIVACY_BODY);
      } else {
        main.innerHTML = offerSkeleton();
        renderOffer(await api.getOffer());
      }
    } catch (_) {
      renderError();
    }

    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ interações */

  document.addEventListener('click', function (event) {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'copy-coupon') {
      event.preventDefault();
      navigator.clipboard.writeText(el.dataset.code).then(function () {
        notify('Cupom copiado');
        el.classList.add('is-copied');
        setTimeout(function () { el.classList.remove('is-copied'); }, 2000);
        track('coupon_copy', { offer_id: OFFER.id, coupon_code: el.dataset.code });
      }).catch(function () {
        notify('Não conseguimos copiar. O código é ' + el.dataset.code);
      });
    } else if (action === 'store-cta') {
      track('store_cta_click', {
        offer_id: OFFER.id, store: OFFER.store,
        price: OFFER.price.current, position: 'decision'
      });
    } else if (action === 'group-cta') {
      track('group_cta_click', { offer_id: OFFER.id, source: location.hash || '#/' });
    } else if (action === 'retry') {
      event.preventDefault();
      route();
    }
  });

  window.addEventListener('hashchange', route);
  route();
})();
