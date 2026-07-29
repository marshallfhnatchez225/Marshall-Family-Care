"use client";
import { useRef, useState } from "react";

export function SignaturePad() {
  const canvas = useRef<HTMLCanvasElement>(null); const drawing = useRef(false); const [signed, setSigned] = useState(false);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const node = canvas.current!; const rect = node.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (node.width / rect.width), y: (event.clientY - rect.top) * (node.height / rect.height) };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => { const ctx = canvas.current?.getContext("2d"); if (!ctx) return; const p = point(event); drawing.current = true; ctx.beginPath(); ctx.moveTo(p.x, p.y); event.currentTarget.setPointerCapture(event.pointerId); };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const ctx = canvas.current?.getContext("2d"); if (!ctx) return; const p = point(event); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#173d35"; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.stroke(); const hidden = document.querySelector<HTMLInputElement>("input[name=signatureData]"); if (hidden && canvas.current) hidden.value = canvas.current.toDataURL("image/png"); setSigned(true); };
  const finish = () => { drawing.current = false; const node = canvas.current; const hidden = document.querySelector<HTMLInputElement>("input[name=signatureData]"); if (node && hidden) hidden.value = signed ? node.toDataURL("image/png") : ""; };
  const clear = () => { const node = canvas.current; if (!node) return; node.getContext("2d")?.clearRect(0, 0, node.width, node.height); const hidden = document.querySelector<HTMLInputElement>("input[name=signatureData]"); if (hidden) hidden.value = ""; setSigned(false); };
  return <div className="mt-2"><canvas ref={canvas} width="900" height="260" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerLeave={finish} className="h-32 w-full touch-none rounded-xl border border-slate-300 bg-white" aria-label="Draw your electronic signature" /><input type="hidden" name="signatureData" required /><button type="button" onClick={clear} className="mt-2 text-sm text-teal-800 underline">Clear signature</button><p className="mt-1 text-xs text-slate-500">Draw your signature above using a finger or mouse.</p></div>;
}
