import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (Whisper limit)

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
  "audio/webm",
];

export async function POST(request: Request) {
  // Auth check
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);

  if (!session || !hasActiveAccess(session.membership)) {
    return NextResponse.json({ error: "Ikkje innlogga" }, { status: 401 });
  }

  if (session.membership.tier !== "community_ai") {
    return NextResponse.json(
      { error: "Krev Community AI-abonnement" },
      { status: 403 }
    );
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ugyldig form-data" }, { status: 400 });
  }

  const audioFile = formData.get("audio");
  if (!(audioFile instanceof File)) {
    return NextResponse.json(
      { error: "Ingen lydfil funnen i forespørselen" },
      { status: 400 }
    );
  }

  if (audioFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Fila er for stor. Maksimal storleik er 25 MB." },
      { status: 400 }
    );
  }

  if (!ACCEPTED_TYPES.includes(audioFile.type)) {
    return NextResponse.json(
      { error: "Filformat ikkje støtta. Bruk MP3, M4A, WAV, OGG eller FLAC." },
      { status: 400 }
    );
  }

  // Transcribe with Whisper
  const openai = new OpenAI();

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "no",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error("Whisper transcription failed:", error);
    return NextResponse.json(
      { error: "Transkripsjon feila. Prøv igjen." },
      { status: 500 }
    );
  }
}
