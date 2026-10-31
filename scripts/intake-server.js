#!/usr/bin/env node
/**
 * FMB · ART — formulário local de nova obra (UPL-11, ADR-0017 layer 3)
 *
 * Substitui os passos manuais da bandeja de entrada: dar nome ao ficheiro, otimizar a foto,
 * duplicar e preencher o TEMPLATE.md. Abre um formulário no browser; ao enviar, escreve em
 * intake/ exatamente o que o Claude Code espera (ver intake/README.md):
 *   intake/<artista>-<nome>.jpeg   foto otimizada (como scripts/optimize.js)
 *   intake/<artista>-<nome>.md     ficha preenchida
 *   intake/<artista>-<nome>.mp3    descrição em áudio, se houver
 *
 * Só corre na tua máquina (127.0.0.1). Não publica nada: depois diz ao Claude
 * "Processa a entrada <nome>".
 *
 * Uso:  npm run intake      (ou duplo clique em "Nova obra.cmd")
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const intake = path.join(root, "intake");
const PORT = Number(process.env.PORT) || 8787;
const MAX_BODY = 80 * 1024 * 1024; // foto + áudio em base64

const slug = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function artists() {
  const src = fs.readFileSync(path.join(root, "art-data.js"), "utf8");
  return [...new Set([...src.matchAll(/artist:\s*"([^"]+)"/g)].map((m) => m[1]))];
}

const yaml = (s) => JSON.stringify(String(s || "")); // string segura em YAML

function ficha(f, name) {
  return `---
photo: ${yaml(name + ".jpeg")}
artist: ${yaml(f.artist)}
age: ${Number(f.age) || ""}
year: ${Number(f.year) || new Date().getFullYear()}
title: ${yaml(f.title)}
---

## Contexto
${(f.context || "").trim()}


## Descrição do artista
${(f.words || "").trim()}


## Sugestões de animação
${(f.anim || "").trim()}


## Notas extra
${(f.notes || "").trim()}
`;
}

async function save(f) {
  const artist = String(f.artist || "").trim();
  if (!artist) throw new Error("Falta o nome do artista.");
  if (!f.title || !String(f.title).trim()) throw new Error("Falta o título (ou uma sugestão).");
  if (!f.photo || !f.photo.data) throw new Error("Falta a foto.");

  const base = slug(f.shortName || f.title);
  if (!base) throw new Error("Nome curto inválido.");
  const name = `${slug(artist)}-${base}`;
  const out = (ext) => path.join(intake, name + ext);
  if ([".jpeg", ".md"].some((e) => fs.existsSync(out(e))) ||
      fs.existsSync(path.join(intake, "processed", name + ".md"))) {
    throw new Error(`Já existe uma entrada chamada "${name}". Escolhe outro nome curto.`);
  }

  const buf = Buffer.from(f.photo.data, "base64");
  let info, format;
  try {
    format = (await sharp(buf).metadata()).format;
    info = await sharp(buf).rotate().resize(3000, 3000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true }).toFile(out(".jpeg"));
  } catch (e) {
    throw new Error("Não consegui ler a foto. Se for do iPhone (HEIC), exporta como JPEG primeiro.");
  }
  // The untouched original, for the printed album (POD-04). Out of git; filing renames it to <id>.
  const origDir = path.join(root, "album", "originais");
  fs.mkdirSync(origDir, { recursive: true });
  fs.writeFileSync(path.join(origDir, `${name}.${format === "jpeg" ? "jpeg" : format}`), buf);

  fs.writeFileSync(out(".md"), ficha({ ...f, artist }, name), "utf8");
  if (f.audio && f.audio.data) fs.writeFileSync(out(".mp3"), Buffer.from(f.audio.data, "base64"));

  return {
    name,
    width: info.width, height: info.height,
    kb: Math.round(info.size / 1024),
    audio: !!(f.audio && f.audio.data)
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error("Ficheiros demasiado grandes.")); req.destroy(); }
      else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const send = (res, code, body, type = "application/json; charset=utf-8") => {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || "";
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return send(res, 403, { error: "Só local." });

    if (req.method === "GET" && req.url === "/") {
      return send(res, 200, fs.readFileSync(path.join(__dirname, "intake-form.html"), "utf8"), "text/html; charset=utf-8");
    }
    if (req.method === "GET" && req.url === "/artists") return send(res, 200, artists());
    if (req.method === "POST" && req.url === "/save") {
      if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.origin || "")) {
        return send(res, 403, { error: "Origem inválida." });
      }
      const f = JSON.parse(await readBody(req));
      return send(res, 200, await save(f));
    }
    send(res, 404, { error: "Não existe." });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log(`\nFormulário de nova obra: ${url}\n(Ctrl+C para fechar)\n`);
  if (!process.env.NO_OPEN) exec(`start "" "${url}"`);
});
