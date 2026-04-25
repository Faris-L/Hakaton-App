<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class TtsController extends Controller
{
    public function synthesize(Request $request)
    {
        $data = $request->validate([
            'text' => 'required|string|min:1|max:5000',
        ]);

        $apiKey = (string) config('elevenlabs.api_key', '');
        $voiceId = (string) config('elevenlabs.voice_id', '');

        if ($apiKey === '' || $voiceId === '') {
            return response()->json([
                'error' => 'ElevenLabs nije konfigurisan. Postavite ELEVENLABS_API_KEY i ELEVENLABS_VOICE_ID u .env',
            ], 503);
        }

        $text = $data['text'];
        $modelId = (string) config('elevenlabs.model_id', 'eleven_multilingual_v2');
        $url = 'https://api.elevenlabs.io/v1/text-to-speech/'.rawurlencode($voiceId);

        try {
            $response = Http::withHeaders([
                'xi-api-key' => $apiKey,
                'Accept' => 'audio/mpeg',
                'Content-Type' => 'application/json',
            ])->timeout(120)->post($url, [
                'text' => $text,
                'model_id' => $modelId,
                'voice_settings' => [
                    'stability' => 0.5,
                    'similarity_boost' => 0.75,
                ],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'TTS servis trenutno nije dostupan.',
            ], 503);
        }

        if (! $response->successful()) {
            $body = $response->json();

            return response()->json([
                'error' => 'ElevenLabs je vratio grešku.',
                'details' => is_array($body) ? $body : $response->body(),
            ], $response->status() >= 400 && $response->status() < 600 ? $response->status() : 502);
        }

        $binary = $response->body();
        if ($binary === '' || $binary === null) {
            return response()->json(['error' => 'Prazan audio odgovor od TTS.'], 502);
        }

        return response($binary, 200, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }
}
