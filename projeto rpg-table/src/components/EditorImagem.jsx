import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import ImagemEditada from "../utils/ImagemEditada";

export default function EditorImagem({ image, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    const croppedImage = await ImagemEditada(image, croppedAreaPixels);
    onSave(croppedImage);
    onClose();
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/90 flex items-center justify-center z-[99999] backdrop-blur-sm">
      <div className="bg-[#250617] p-6 rounded-2xl w-[420px] h-[520px] flex flex-col border border-[#b82870]/50 shadow-[0_0_30px_rgba(184,40,112,0.2)]">
        
        <div className="relative flex-1 rounded-xl overflow-hidden bg-black/50 border border-gray-700">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-6 w-full accent-[#b82870] cursor-pointer"
        />

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="bg-black/40 hover:bg-black/60 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg text-white font-bold transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="bg-[#b82870] hover:bg-[#9a205d] px-6 py-2 rounded-lg text-white font-bold shadow-lg shadow-[#b82870]/20 transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}