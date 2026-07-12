import { NextResponse } from "next/server";
import { constants, createSign, X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { randomTenStr } from "@/lib/helper";

export const runtime = "nodejs";

const privateKeyPath = path.resolve(process.cwd(), "cert/jetbra.key");

const certificatePath = path.resolve(process.cwd(), "cert/jetbra.pem");

const privateKey = readFileSync(privateKeyPath, "utf8");
const certificatePem = readFileSync(certificatePath, "utf8");

const certificateBase64 = new X509Certificate(certificatePem).raw.toString(
  "base64",
);

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return NextResponse.json(
        {
          message: "请求参数必须是 JSON 对象",
        },
        {
          status: 400,
        },
      );
    }

    const licenseId = randomTenStr();

    const licenseJsonStr = JSON.stringify({
      licenseId,
      ...payload,
    });

    const licenseJsonBase64 = Buffer.from(licenseJsonStr, "utf8").toString(
      "base64",
    );

    const licenseJsonSignature = signJson(licenseJsonStr);

    return NextResponse.json({
      license: [
        licenseId,
        licenseJsonBase64,
        licenseJsonSignature,
        certificateBase64,
      ].join("-"),
      demo: true,
    });
  } catch (error) {
    console.error("生成 License 失败：", error);

    return NextResponse.json(
      {
        message: "生成 License 失败",
      },
      {
        status: 500,
      },
    );
  }
}

function signJson(json: string): string {
  const signer = createSign("RSA-SHA1");

  signer.update(json, "utf8");
  signer.end();

  return signer.sign(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_PADDING,
    },
    "base64",
  );
}
