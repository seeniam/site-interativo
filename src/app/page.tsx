import { redirect } from "next/navigation";

/**
 * Fase 0: o convite ainda não existe (Fase 3). Enquanto isso, a raiz leva à referência visual.
 * Ver docs/DECISOES.md, Fase 0.
 */
export default function Home() {
  redirect("/design-system");
}
