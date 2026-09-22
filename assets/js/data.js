/* =====================================================================
   Achadinhos da Carol — dados da oferta (MVP estático, um produto)
   ---------------------------------------------------------------------
   ATENÇÃO: imagem e link de afiliado são reais. Preço, preço anterior,
   parcelamento e frete são valores de EXEMPLO para o layout — confira na
   Shopee e substitua antes de publicar. Campo que você não puder confirmar
   deve ficar como null: a interface esconde o bloco em vez de inventar.
   ===================================================================== */

window.CAROL = {

  /* Destinos permitidos. Link fora dessa lista não vira botão: a oferta
     aparece como indisponível. Protege contra redirecionamento aberto. */
  ALLOWED_HOSTS: [
    'shopee.com.br', 's.shopee.com.br', 'shp.ee',
    'mercadolivre.com.br', 'produto.mercadolivre.com.br', 'mercadolibre.com',
    'amazon.com.br', 'amzn.to'
  ],

  GROUP_URL: 'https://chat.whatsapp.com/LRMJnGVSiIsDfDbZXQTEdZ',

  STORES: {
    shopee:          { id: 'shopee',         name: 'Shopee' },
    'mercado-livre': { id: 'mercado-livre',  name: 'Mercado Livre' },
    amazon:          { id: 'amazon',         name: 'Amazon' }
  },

  OFFER: {
    id: 'of-001',
    slug: 'jogo-panelas-antiaderente-cabo-amadeirado',
    status: 'active',                 // 'active' | 'expired' | 'paused'

    title: 'Jogo de panelas antiaderente 5 peças com cabo amadeirado',
    shortTitle: 'Jogo de panelas antiaderente 5 peças',
    category: 'Casa e cozinha',

    imageUrl: 'assets/img/jogo-panelas-cabo-madeira.jpg',
    imageAlt: 'Jogo de panelas bege com acabamento marmorizado, cabos e pegadores em madeira clara, com tampas de vidro temperado',

    store: 'shopee',

    price: {
      current: 256.41,                // exemplo — confirmar na loja
      previous: 329.90,               // exemplo — remover se o preço cheio não for real
      currency: 'BRL',
      installments: 'em até 6x sem juros'
    },

    coupon: null,                     // { code: 'CASA15', description: '...' }
    shipping: { label: 'Frete grátis acima do valor mínimo', conditional: true },
    stockLabel: null,

    affiliateUrl: 'https://s.shopee.com.br/4Vczn8Z6p8',
    editorialNote: 'Achado da Carol',

    publishedAt: '2026-09-22T13:40:00-03:00',
    checkedAt:   '2026-09-22T13:40:00-03:00',
    expiresAt: null,

    seo: {
      title: 'Jogo de panelas antiaderente 5 peças com cabo amadeirado — Achadinhos da Carol',
      description: 'Jogo de 5 panelas antiaderentes com tampas de vidro e cabo amadeirado. Veja o preço atual na Shopee.',
      ogImageUrl: null
    }
  }
};
