import { NextResponse } from "next/server";

const APPS_API_URL = "https://jetbrains.ankio.net/apps";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(APPS_API_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "jetbrains-license-ui",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Apps upstream request failed:", {
        status: response.status,
        body: text,
      });

      return NextResponse.json(
        {
          code: 502,
          message: "上游应用接口请求失败",
          upstreamStatus: response.status,
        },
        { status: 502 },
      );
    }

    const data: unknown = JSON.parse(text);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Apps proxy error:", error);

    return NextResponse.json(
      {
        code: 500,
        message: "无法获取应用列表",
      },
      { status: 500 },
    );
  }
}
