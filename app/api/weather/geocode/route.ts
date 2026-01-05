import { NextRequest, NextResponse } from "next/server";
import { getCityFromCoordinates } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Parâmetros 'lat' e 'lon' são obrigatórios" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Coordenadas inválidas" },
        { status: 400 }
      );
    }

    // Nominatim não requer API key, mas mantemos o parâmetro para compatibilidade
    const apiKey = process.env.TOMORROW_IO_API_KEY || "";

    const result = await getCityFromCoordinates(latitude, longitude, apiKey);

    // Sempre retornar algo, mesmo que seja um nome genérico
    if (!result) {
      // Retornar coordenadas como fallback
      return NextResponse.json({
        city: "Localização Atual",
        country: "",
        coordinates: { lat: latitude, lon: longitude },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro em /api/weather/geocode:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar cidade",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

