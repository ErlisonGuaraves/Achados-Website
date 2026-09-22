# Achadinhos da Carol — página de oferta (MVP)

Site estático em HTML, CSS e JavaScript puros. Sem build, sem dependências,
sem backend. Uma única oferta, somente visualização.

## Rodar

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Abrir o `index.html` direto pelo `file://` também funciona, mas a cópia de
cupom exige `http://` ou `https://`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Casca da página: cabeçalho, rodapé, metadados sociais |
| `assets/css/styles.css` | Estilo completo, tokens no `:root` |
| `assets/js/data.js` | **Os dados da oferta.** É o único arquivo que você edita no dia a dia |
| `assets/js/app.js` | Renderização, rotas em hash, métricas |
| `assets/img/` | Foto do produto e logo |

## Antes de publicar

1. **Salve a logo** em `assets/img/logo.png` (quadrada, fundo transparente ou
   claro). Enquanto o arquivo não existir, o cabeçalho mostra um símbolo
   provisório no lugar.
2. **Confira o preço** em `assets/js/data.js`. `price.current`,
   `price.previous`, `price.installments` e `shipping` são valores de exemplo.
   Campo que você não puder confirmar deve ficar `null` — a interface esconde o
   bloco em vez de exibir dado inventado.
3. Ajuste `publishedAt` e `checkedAt` (a página mostra "publicada há X" e
   "preço verificado há X" a partir deles).
4. Troque as URLs `https://achadinhosdacarol.com.br/` em `index.html`
   (`canonical` e `og:url`) pelo domínio real.

## Trocar a oferta

Edite o objeto `CAROL.OFFER` em `assets/js/data.js`. Campos opcionais aceitam
`null`: `coupon`, `shipping`, `stockLabel`, `price.previous`,
`price.installments`, `editorialNote`.

Para encerrar uma oferta, mude `status` para `'expired'` ou preencha
`expiresAt`. O botão da loja vira "Oferta encerrada" e o Grupo VIP assume.

## Segurança do link de afiliado

`CAROL.ALLOWED_HOSTS` é a lista de domínios aceitos. Um `affiliateUrl` fora
dessa lista, ou que não seja `https`, não vira botão: a oferta aparece como
indisponível. É o que impede o site de ser usado como redirecionador.

## Métricas

Os eventos (`offer_view`, `store_cta_click`, `group_cta_click`, `coupon_copy`)
entram em `window.dataLayer` e no console. Nenhum dado pessoal é
registrado. Para ligar ao GA4 ou Plausible, leia essa fila.

## O que ficou fora (precisa de servidor)

- **Redirecionamento `/r/:offerId` com registro de clique.** Aqui o botão é um
  link direto para a loja, com `rel="sponsored noopener noreferrer"`. A
  validação de domínio acontece no navegador. Para contar cliques no servidor e
  esconder o link de afiliado, é preciso backend.
- **Funcionar sem JavaScript.** A página é montada por JS. O `<noscript>` do
  `index.html` mantém os links da loja e do grupo acessíveis nesse caso.
- **Open Graph por oferta.** As metatags iniciais são as do `index.html`. O JS
  as atualiza depois de carregar, mas o WhatsApp e o Instagram leem o HTML
  original — com uma oferta só, basta manter o `index.html` sincronizado com
  `data.js`.
