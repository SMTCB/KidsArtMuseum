# Entrada de nova obra — Como funciona

Esta pasta é a **bandeja de entrada** do museu. Para adicionar uma nova obra:

---

## Passo 1 — Preparar a foto

Tira (ou escolhe) a foto da obra e dá-lhe um nome lowercase e hifenizado:

- Padrão: `<artista>-<substantivo-curto>.jpeg` (ou `.jpg`, `.png`)
- Exemplos: `miguel-gato-cubista.jpeg`, `muna-borboleta.jpeg`

Guarda o ficheiro nesta pasta (`intake/`). Não precisas de fazer mais nada com a foto —
**o script de otimização trata do resto** (passo 2).

> **iPhone (HEIC)?** Exporta como JPEG antes de copiar:
> nas Fotos do iPhone escolhe "Partilhar → ficheiro" e seleciona JPEG.
> Ou usa [heictojpg.com](https://heictojpg.com).

---

## Passo 2 — Otimizar a foto (substitui o Squoosh)

No terminal, dentro da pasta do projeto:

```powershell
# Primeira vez — instala o Sharp (MozJPEG):
npm install

# Depois, para cada nova obra:
node scripts/optimize.js miguel-gato-cubista.jpeg
```

O script:
- Roda a foto para a posição certa (EXIF automático)
- Redimensiona para que o lado longo fique ≤ 3000px
- Comprime com MozJPEG a qualidade 78 — o mesmo codec do Squoosh
- Guarda como `intake/miguel-gato-cubista.jpeg` e mostra dimensões + poupança em KB

---

## Passo 3 — Preencher o formulário

1. Duplica o ficheiro `TEMPLATE.md` e dá-lhe o mesmo nome base da foto:
   - Foto: `miguel-gato-cubista.jpeg` → Formulário: `miguel-gato-cubista.md`
2. Preenche os campos do cabeçalho (entre `---`) e as secções de texto abaixo.
3. Guarda.

---

## Passo 4 — Pedir ao Claude Code para processar

No Claude Code, diz simplesmente:

> Processa a entrada `miguel-gato-cubista`

O Claude vai:
1. Ler a foto e o formulário desta pasta
2. Analisar as dimensões e amostrar as cores dominantes
3. Criar a entrada em `art-data.js` (título, paleta, animação, pontos de descoberta)
4. Mover a foto para `assets/art/`
5. Arquivar o formulário em `intake/processed/`
6. Mostrar o diff para aprovação antes de fazer commit

---

## O que o Claude decide por ti

| Campo | Quem decide |
|---|---|
| `bg` e `palette` | Claude (amostra pixels reais) |
| `anim` | Claude (escolhe da lista existente, ou inventa se nenhuma servir) |
| `dots` | Claude (3–4 pontos, coordenadas em percentagem) |
| `signature` | Claude (segue o padrão do ART_GUIDE §4) |
| `w` / `h` | Claude (lê do ficheiro otimizado) |
| Posição no corredor | Final da fila — podes pedir outra posição |

---

> Ficheiros nesta pasta não são servidos pelo Vercel (`.vercelignore`).
> A pasta `intake/processed/` guarda os formulários já tratados como memória histórica.
