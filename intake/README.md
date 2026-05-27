# Entrada de nova obra — Como funciona

Esta pasta é a **bandeja de entrada** do museu. Para adicionar uma nova obra:

## Passo 1 — Preparar a foto

1. Tira a foto da obra (ou usa a que já tens).
2. Passa-a pelo [Squoosh](https://squoosh.app):
   - Formato: **MozJPEG**, qualidade **78**
   - Redimensiona para que o lado longo fique ≤ 3000px
   - Roda para que o "cima" fique em cima
   - Corta dedos, fita-cola e bordas de mesa — a não ser que façam parte da obra
3. Guarda o ficheiro nesta pasta (`intake/`) com um nome lowercase e hifenizado:
   - Padrão: `<artista>-<substantivo-curto>.jpeg`
   - Exemplos: `miguel-gato-cubista.jpeg`, `muna-borboleta.jpeg`

## Passo 2 — Preencher o formulário

1. Duplica o ficheiro `TEMPLATE.md` e dá-lhe o mesmo nome base da foto:
   - Foto: `miguel-gato-cubista.jpeg` → Formulário: `miguel-gato-cubista.md`
2. Preenche os campos do cabeçalho (entre `---`) e as secções de texto abaixo.
3. Guarda.

## Passo 3 — Pedir ao Claude Code para processar

No Claude Code, diz simplesmente:

> Processa a entrada `miguel-gato-cubista`

Ou, se só há um ficheiro na bandeja:

> Processa a nova obra da bandeja de entrada

O Claude vai:
1. Ler a foto e o formulário desta pasta
2. Analisar as dimensões e amostrar as cores dominantes
3. Criar a entrada em `art-data.js` (título, paleta, animação, pontos de descoberta)
4. Mover a foto para `assets/art/`
5. Arquivar o formulário em `intake/processed/`
6. Mostrar o diff para aprovação antes de fazer commit

## O que o Claude decide por ti

| Campo | Quem decide |
|---|---|
| `bg` e `palette` | Claude (amostra pixels reais) |
| `anim` | Claude (escolhe da lista existente, ou inventa se nenhuma servir) |
| `dots` | Claude (3–4 pontos, coordenadas em percentagem) |
| `signature` | Claude (segue o padrão do ART_GUIDE §4) |
| `w` / `h` | Claude (lê do ficheiro) |
| Posição no corredor | Final da fila — podes pedir outra posição |

## O que tu decides

- O título (podes sugerir no formulário, o Claude refina)
- A descrição e contexto (o que a criança disse, o que estava a acontecer)
- Se a animação sugerida faz sentido — o Claude explica a escolha e pede aprovação

---

> Ficheiros nesta pasta não são servidos pelo Vercel (estão em `.vercelignore`).
> A pasta `intake/processed/` guarda os formulários já tratados como memória histórica.
