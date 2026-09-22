# Achadinhos da Carol — página de oferta (MVP)

Site estático em HTML, CSS e JavaScript puros. Sem build, sem dependências,
sem backend. Uma única oferta, somente visualização.

## Rodar

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Publicar no Netlify

Não há build. Arraste a pasta inteira para o painel do Netlify, ou conecte o
repositório deixando o comando de build vazio e o diretório de publicação como
`.` (a raiz). A prévia do link no WhatsApp funciona assim que o site estiver no
ar em HTTPS.

Abrir o `index.html` direto pelo `file://` também funciona, mas a cópia de
cupom exige `http://` ou `https://`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Casca da página: cabeçalho, rodapé, metadados sociais |
| `assets/css/styles.css` | Estilo completo, tokens no `:root` |
| `assets/js/data.js` | **Os dados da oferta.** É o único arquivo que você edita no dia a dia |
| `assets/js/app.js` | Renderização, rotas em hash, métricas |
| `assets/img/` | Foto do produto (AVIF, WebP, JPEG) e os vetores da marca |

## Antes de publicar

1. **Troque a logo.** O cabeçalho usa `assets/img/logo.svg`, um selo vetorial
   provisório que desenhei com as cores da marca. Para usar a sua: salve o
   arquivo em `assets/img/` e aponte o `src` do `.brand__logo` no `index.html`
   para ele. Se for SVG, dá para simplesmente sobrescrever o `logo.svg`.
2. **Confira o preço** em `assets/js/data.js`. `price.current`,
   `price.previous`, `price.installments` e `shipping` são valores de exemplo.
   Campo que você não puder confirmar deve ficar `null` — a interface esconde o
   bloco em vez de exibir dado inventado.
3. Ajuste `publishedAt` e `checkedAt` (a página mostra "publicada há X" e
   "preço verificado há X" a partir deles).
4. Se mudar o título ou a descrição da oferta em `data.js`, repita os mesmos
   textos no `<title>`, na `description` e nas tags `og:` do `index.html`. São
   elas que o WhatsApp lê ao montar a prévia do link — o robô dele não executa
   JavaScript.

## Imagens

Tudo que é interface é vetor: `logo.svg` (marca), `favicon.svg` (aba do
navegador), `placeholder.svg` (usado se a foto do produto falhar) e os ícones,
que são `<svg>` inline no `app.js` — não custam requisição.

A foto do produto é fotografia, então continua raster, servida por `<picture>`
na melhor versão que o navegador aceitar:

| Arquivo | Tamanho | Quem recebe |
|---|---:|---|
| `.avif` | 43 KB | navegadores atuais |
| `.webp` | 49 KB | Safari mais antigo e afins |
| `.jpg` | 76 KB | fallback universal e prévia no WhatsApp |

Ao trocar de produto, gere os três a partir da foto original:

```bash
python3 -c "
from PIL import Image
im = Image.open('assets/img/SUA-FOTO.jpg').convert('RGB')
im.save('assets/img/SUA-FOTO.webp', quality=82, method=6)
im.save('assets/img/SUA-FOTO.avif', quality=60)"
```

Depois aponte `imageUrl` e `imageSources` em `data.js` para os novos arquivos.
Só o `.jpg` precisa estar em `og:image` no `index.html` — as redes sociais não
leem AVIF.

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
- **Open Graph por oferta.** As tags `og:` vivem no `index.html` e valem para
  a página inteira. Com uma oferta só isso basta; com várias, cada uma
  precisaria do seu próprio HTML.
