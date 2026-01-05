import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/weather";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Buscar API key: priorizar header do cliente, depois variável de ambiente
    const clientApiKey = request.headers.get("X-API-Key");
    const serverApiKey = process.env.TOMORROW_IO_API_KEY;
    const apiKey = clientApiKey || serverApiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Chave de API não configurada. Configure uma chave no menu lateral.",
          code: "API_KEY_MISSING",
        },
        { status: 500 }
      );
    }

    const results = await searchCities(query, apiKey);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao buscar cidades",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

