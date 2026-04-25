<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class FlashcardGenerateController extends Controller
{
    public function generate(Request $request)
    {
        $data = $request->validate([
            'topic' => 'required|string|min:2|max:500',
            'count' => 'required|integer|min:1|max:40',
        ]);

        $n = (int) $data['count'];
        $topic = $data['topic'];

        $system = "Generišeš flash kartice za učenje. Izlaz: ISKLJUČIVO valjan JSON (bez okružujućeg teksta) u obliku: ".
            '{"cards":[{"question":"...","answer":"...","difficulty":"easy|medium|hard"}]} '.
            "Jezik: srpski (latinica). Nema opisa, nema simulacija, nema beleški. Pitanja jasna, odgovori kratki.";

        $user = "Tema: \"{$topic}\". Broj parova: {$n}.";

        try {
            $payload = [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
                'max_tokens' => 4096,
            ];
            try {
                $response = OpenAI::chat()->create(array_merge($payload, [
                    'response_format' => ['type' => 'json_object'],
                ]));
            } catch (Throwable) {
                $response = OpenAI::chat()->create($payload);
            }
        } catch (Throwable $e) {
            report($e);

            return response()->json(['error' => 'Generisanje trenutno nije moguće.'], 503);
        }

        $raw = $response->choices[0]->message->content ?? '{}';
        $parsed = is_string($raw) ? json_decode($raw, true) : null;
        if (! is_array($parsed) || ! isset($parsed['cards']) || ! is_array($parsed['cards'])) {
            return response()->json(['error' => 'Odgovor modela nije u očekivanom formatu.'], 502);
        }

        $out = [];
        foreach ($parsed['cards'] as $c) {
            if (! is_array($c) || ! isset($c['question'], $c['answer'])) {
                continue;
            }
            $d = in_array($c['difficulty'] ?? '', ['easy', 'medium', 'hard'], true)
                ? $c['difficulty'] : 'medium';
            $out[] = [
                'question' => (string) $c['question'],
                'answer' => (string) $c['answer'],
                'difficulty' => $d,
            ];
            if (count($out) >= $n) {
                break;
            }
        }

        if (count($out) === 0) {
            return response()->json(['error' => 'Model nije vratio nijednu validnu karticu.'], 502);
        }

        return response()->json(['cards' => $out]);
    }
}
