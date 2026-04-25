<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class SimulationController extends Controller
{
    public const FIELDS = [
        'medicine' => 'Medicina / zdravstvo',
        'psychology' => 'Psihologija / savetovanje',
        'economy' => 'Ekonomija i biznis',
        'it' => 'Informatika / IT',
    ];

    public function startScenario(Request $request)
    {
        $request->validate([
            'field' => 'required|in:medicine,psychology,economy,it',
            'index' => 'nullable|integer|min:1|max:10',
        ]);

        $field = $request->input('field');
        $index = (int) $request->input('index', 1);
        $label = self::FIELDS[$field];

        if (! config('openai.api_key') && app()->environment('local')) {
            return response()->json($this->mockStart($index));
        }

        $system = 'Ti si asistent za edukativnu simulaciju. Oblast: '.$label.'. '
            .'Generiši kratku prvu poruku u scenariju: igraš ulogu klijenta/pacijenta/korisnika (NE asistenta). '
            .'Jedna poruka na srpskom, 2–5 rečenica, realan scenario broj '. $index .' od 10. '
            .'Direktno u prvom licu, bez naslova ili meta-komentara.';

        $user = "Početak scenarija {$index} od 10. Oblast: {$label}.";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'Nije moguće učitati scenarij. Proveri OPENAI_API_KEY u .env.',
            ], 503);
        }

        $text = trim($response->choices[0]->message->content);

        return response()->json([
            'index' => $index,
            'total' => 10,
            'minutes' => 10,
            'assistant_message' => $text,
        ]);
    }

    public function evaluateAnswer(Request $request)
    {
        $request->validate([
            'field' => 'required|in:medicine,psychology,economy,it',
            'scenario_index' => 'required|integer|min:1|max:10',
            'scenario_text' => 'required|string|max:12000',
            'user_message' => 'required|string|max:8000',
        ]);

        $field = $request->input('field');
        $label = self::FIELDS[$field];
        $scenarioText = $request->input('scenario_text');
        $userMessage = $request->input('user_message');

        if (! config('openai.api_key') && app()->environment('local')) {
            return response()->json($this->mockEvaluate());
        }

        $system = "Ti si iskusni edukator u oblasti: {$label}. "
            .'Student rešava simulaciju životnog scenarija. '
            .'Oceni odgovor skalom 0–10. Vrati ISKLJUČIVO valjan JSON (bez markdown) u obliku: '
            .'{"score": number, "summary": "kratka fraza na srpskom npr. Odličan odgovor!", '
            .'"good": ["stvar 1", "stvar 2"], "improve": ["sugestija 1", "sugestija 2"], '
            .'"ideal": "Jedan pasus predloga idealnog pristupa na srpskom."} '
            .'good: 2–3 stavke, improve: 2–3 stavke.';

        $user = "Kontekst scenarija (klijent/korisnik): {$scenarioText}\n\nOdgovor studenta: {$userMessage}";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'Nije moguće oceniti odgovor. Proveri OPENAI_API_KEY u .env.',
            ], 503);
        }

        $raw = $response->choices[0]->message->content;
        $data = is_string($raw) ? json_decode($raw, true) : [];
        if (! is_array($data)) {
            $data = [];
        }

        $score = isset($data['score']) ? (float) $data['score'] : 7.0;
        $summary = is_string($data['summary'] ?? null) ? $data['summary'] : 'Povratna informacija';
        $good = is_array($data['good'] ?? null) ? $data['good'] : ['Dobar pristup problemu.'];
        $improve = is_array($data['improve'] ?? null) ? $data['improve'] : ['Razmisli o dodatnim detaljima.'];
        $ideal = is_string($data['ideal'] ?? null) ? $data['ideal'] : 'Nastavi da vežbaš strpljivim, strukturisanim pristupom.';

        return response()->json([
            'score' => min(10, max(0, $score)),
            'summary' => $summary,
            'good' => array_values($good),
            'improve' => array_values($improve),
            'ideal' => $ideal,
        ]);
    }

    private function mockStart(int $index): array
    {
        $lines = [
            1 => 'Zdravo. Osećam se preplavljeno u poslednje vreme. Teško mi je da govorim o tome s porodicom, a posao trpi.',
            2 => 'Dobro jutro. Klijent pita kako da odloži odluku o ulaganju ne izazivajući paniku u timu.',
        ];

        return [
            'index' => $index,
            'total' => 10,
            'minutes' => 10,
            'assistant_message' => $lines[$index] ?? "Scenarij broj {$index}. Opiši osećaj situacije (mock podatak bez API ključa).",
        ];
    }

    private function mockEvaluate(): array
    {
        return [
            'score' => 8.5,
            'summary' => 'Odličan odgovor!',
            'good' => [
                'Postavio/la si dobar redosled koraka.',
                'Koristila/koristio si otvorena pitanja.',
            ],
            'improve' => [
                'Dodaj više o emocionalnoj podršci i validaciji.',
                'Kratko sumiraj dogovorene naredne korake.',
            ],
            'ideal' => 'Kratko potvrdi osećaj sagovornika, predloži jedan konkretan mali sledeći korak i zakaži proveru napretka. Drži se neutralnog, podržavajućeg tona.',
        ];
    }
}
