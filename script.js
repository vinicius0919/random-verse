const versoElemento = document.getElementById("verso");
const referenciaElemento = document.getElementById("referencia");
const refreshBtn = document.getElementById("refreshBtn");
const whatsBtn = document.getElementById("whatsBtn");
const imgBtn = document.getElementById("imgBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function carregarVerso() {
  versoElemento.textContent = "Carregando...";
  referenciaElemento.textContent = "";

  try {
    const resposta = await fetch(
      `https://bible-api.com/data/almeida/random?ts=${Date.now()}`,
    );

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();

    const verso = dados?.random_verse;

    if (!verso || !verso.text) {
      throw new Error("Formato inesperado da API");
    }

    versoElemento.textContent = `"${verso.text.trim()}"`;
    referenciaElemento.textContent = `${verso.book} ${verso.chapter}:${verso.verse}`;
  } catch (erro) {
    versoElemento.textContent = "Não foi possível carregar o versículo.";
    referenciaElemento.textContent = "";
    console.error("Erro:", erro);
  }
}
function compartilharWhatsApp() {
  const mensagem = `${versoElemento.textContent}\n\n${referenciaElemento.textContent}`;
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

/* ================= CANVAS ================= */

function quebrarTexto(ctx, texto, maxWidth) {
  const palavras = texto.split(" ");
  let linhas = [];
  let linhaAtual = "";

  palavras.forEach((palavra) => {
    const teste = linhaAtual + palavra + " ";
    const largura = ctx.measureText(teste).width;

    if (largura > maxWidth) {
      linhas.push(linhaAtual);
      linhaAtual = palavra + " ";
    } else {
      linhaAtual = teste;
    }
  });

  linhas.push(linhaAtual);
  return linhas;
}

async function gerarImagem() {
  const texto = versoElemento.textContent.replace(/^"|"$/g, "");
  const referencia = referenciaElemento.textContent;

  const maxWidth = 900;
  let fontSize = 60;

  if (texto.length > 350) fontSize = 42;
  else if (texto.length > 250) fontSize = 48;
  else if (texto.length > 180) fontSize = 54;

  ctx.font = `bold ${fontSize}px Segoe UI`;

  const linhas = quebrarTexto(ctx, texto, maxWidth);
  const lineHeight = fontSize * 1.4;

  const alturaTexto = linhas.length * lineHeight;
  const alturaReferencia = 100;
  const padding = 200;

  const alturaFinal = alturaTexto + alturaReferencia + padding;

  canvas.height = Math.max(1080, alturaFinal);

  // ⚠ Reconfigurar após resize
  ctx.textAlign = "center";

  // 🎨 Gradiente
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1e3c72");
  gradient.addColorStop(0.5, "#2a5298");
  gradient.addColorStop(1, "#4facfe");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ✨ Sombra
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // 📝 Texto
  ctx.fillStyle = "white";
  ctx.font = `bold ${fontSize}px Segoe UI`;

  const blocoTotal = alturaTexto + alturaReferencia;
  let y = (canvas.height - blocoTotal) / 2;

  linhas.forEach((linha) => {
    ctx.fillText(linha.trim(), canvas.width / 2, y);
    y += lineHeight;
  });

  // 📖 Referência
  ctx.fillStyle = "#ffd700";
  ctx.font = `bold ${fontSize - 10}px Segoe UI`;
  ctx.fillText(referencia, canvas.width / 2, y + 40);

  // 🔄 Reset sombra
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve));

  const file = new File([blob], "versiculo.png", { type: "image/png" });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Versículo Bíblico",
    });
  } else {
    const link = document.createElement("a");
    link.download = "versiculo.png";
    link.href = canvas.toDataURL();
    link.click();
  }
}
/* ================= EVENTOS ================= */

refreshBtn.addEventListener("click", carregarVerso);
whatsBtn.addEventListener("click", compartilharWhatsApp);
imgBtn.addEventListener("click", gerarImagem);

carregarVerso();

/* ================= PWA ================= */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
