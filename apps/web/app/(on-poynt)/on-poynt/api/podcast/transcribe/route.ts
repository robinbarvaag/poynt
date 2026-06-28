import { getSessionWithMembership } from "@/lib/membership";
import {
  hasActiveAccess,
  hasAiTools,
} from "@/lib/membership/has-active-access";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Transkribering kan ta tid – la funksjonen køyra lenge nok.
export const maxDuration = 300;

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
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  if (!hasAiTools(session.membership.tier)) {
    return NextResponse.json(
      { error: "Krever Community AI-abonnement" },
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
      { error: "Ingen lydfil funnet i forespørselen" },
      { status: 400 }
    );
  }

  if (audioFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Filen er for stor. Maksimal størrelse er 25 MB." },
      { status: 400 }
    );
  }

  if (!ACCEPTED_TYPES.includes(audioFile.type)) {
    return NextResponse.json(
      { error: "Filformat ikke støttet. Bruk MP3, M4A, WAV, OGG eller FLAC." },
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
      { error: "Transkripsjon feilet. Prøv igjen." },
      { status: 500 }
    );
  }
}
