import { connection } from "next/server";
import { listarPresentesReservados } from "@/lib/api/presentes";
import { obterRepositorio } from "@/lib/api/servidor";

export async function GET() {
  await connection();
  return listarPresentesReservados(obterRepositorio());
}
