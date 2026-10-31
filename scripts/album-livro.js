/* livro.html in the browser (POD-03). Not a Node script: scripts/album.js writes it into the file
   after StPageFlip, next to IMG (each work's photo, base64, by id) and FOLIOS (printed page count).

   Leaves, by StPageFlip index: 0 cover, 1 inside of the cover, 2 .. FOLIOS+1 the printed pages
   1 .. FOLIOS, then the inside of the back cover and the back cover. */
(() => {
  // The pages say __img_<id>__ where a photo goes; one blob URL per photo serves every use of it
  const urls = {};
  for (const [id, b64] of Object.entries(IMG)) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    urls[id] = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
  }
  const book = document.getElementById("book");
  book.innerHTML = document.getElementById("pages").innerHTML.replace(/__img_(\w+)__/g, (_, id) => urls[id]);
  const SHEET = book.querySelector(".sheet").offsetWidth; // 210 mm in CSS px
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const where = document.getElementById("where"), prev = document.getElementById("prev"), next = document.getElementById("next");

  // A sheet keeps its printed layout and is scaled to whatever size its leaf is given
  const fit = new ResizeObserver((entries) => {
    for (const e of entries) {
      const w = e.contentRect.width;
      if (w) e.target.firstElementChild.style.transform = `scale(${w / SHEET})`;
    }
  });

  document.fonts.ready.then(() => {
    fitPages(); // the print's own fitting (long titles), at full size, before anything is scaled
    const flip = new St.PageFlip(book, {
      width: 794, height: 1123, size: "stretch", minWidth: 280, maxWidth: 794, minHeight: 396, maxHeight: 1123,
      showCover: true, maxShadowOpacity: 0.35, mobileScrollSupport: false, flippingTime: calm ? 300 : 900
    });
    const leaves = book.querySelectorAll(".leaf");
    flip.loadFromHTML(leaves);
    leaves.forEach((l) => fit.observe(l));
    book.classList.add("on");

    const last = flip.getPageCount() - 1;
    const label = (i) => {
      if (i <= 0) return "Capa";
      if (i >= last) return "Contracapa";
      const page = (f) => (f >= 1 && f <= FOLIOS ? f : null);
      if (flip.getOrientation() === "portrait") return page(i - 1) ? `${i - 1} de ${FOLIOS}` : "Guarda";
      const left = i % 2 ? i : i - 1, l = page(left - 1), r = page(left);
      return `${l && r ? `${l} – ${r}` : l || r} de ${FOLIOS}`;
    };
    const show = (i) => {
      where.textContent = label(i);
      prev.disabled = i <= 0;
      next.disabled = i >= last;
    };
    flip.on("flip", (e) => show(e.data));
    flip.on("changeOrientation", () => show(flip.getCurrentPageIndex()));
    show(0);

    // With reduced motion the buttons and keys turn the page without the animation
    const go = (dir) => {
      if (!calm) return dir > 0 ? flip.flipNext() : flip.flipPrev();
      dir > 0 ? flip.turnToNextPage() : flip.turnToPrevPage();
      show(flip.getCurrentPageIndex());
    };
    next.addEventListener("click", () => go(1));
    prev.addEventListener("click", () => go(-1));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    });
  });
})();
