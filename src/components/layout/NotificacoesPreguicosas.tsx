"use client";

import dynamic from "next/dynamic";

/**
 * O Toaster do sonner só chega depois da hidratação: nenhuma página precisa dele para a
 * primeira pintura, e assim ele não pesa no tempo de bloqueio (Lighthouse, briefing 8).
 */
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

export function NotificacoesPreguicosas() {
  return <Toaster position="top-center" toastOptions={{ className: "toast-convite" }} />;
}
