import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR code do link de visitante, pra plateia entrar so escaneando (ver App.js: salaVisitanteUrl
// e o parametro ?visitante=1). So o mestre ve isso.
export default function QRCodeConvite({ link }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [erro, setErro] = useState(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto || !link) return;

    let cancelado = false;
    setErro(null);

    QRCode.toDataURL(link, { width: 220, margin: 1, color: { dark: "#1a0a12", light: "#ffffff" } })
      .then((url) => {
        if (!cancelado) setDataUrl(url);
      })
      .catch((error) => {
        console.error("Erro ao gerar QR code:", error);
        if (!cancelado) setErro("Não foi possível gerar o QR code.");
      });

    return () => {
      cancelado = true;
    };
  }, [aberto, link]);

  if (!link) return null;

  return (
    <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-bold tracking-widest text-gray-300"
      >
        <span>CONVIDAR PLATEIA</span>
        <span className="text-xs text-gray-500">{aberto ? "▲" : "▼"}</span>
      </button>

      {aberto && (
        <div className="mt-3 flex flex-col items-center gap-2">
          {erro ? (
            <p className="text-xs text-red-400">{erro}</p>
          ) : dataUrl ? (
            <img src={dataUrl} alt="QR code para entrar na sala como visitante" className="rounded-lg border border-gray-700" width={180} height={180} />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-gray-500">
              Gerando...
            </div>
          )}
          <p className="text-center text-[11px] text-gray-500">
            Quem escanear entra como visitante: vê a mesa e rola dados, mas não cria personagem.
          </p>
        </div>
      )}
    </div>
  );
}
