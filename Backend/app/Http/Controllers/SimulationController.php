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
        ]);

        $field = $request->input('field');
        $label = self::FIELDS[$field];

        if (! config('openai.api_key') && app()->environment('local')) {
            return response()->json($this->mockStart());
        }

        $system = 'Ti pripremaš JEDAN kratak otvor za edukativni razgovor. Oblast: '.$label.'. '
            .'Igra uloge: kasniji razgovor je između studenta (savetnik/student) i klijenta/pacijenta (ti ćeš igrati klijenta u sledećim porukama). '
            .'Sada generiši samo PRVU poruku u prvom licu kao klijent: 2 do 3 rečenice, realna situacija, i JEDNO jasno pitanje o problemu. '
            .'Slovima srpski. Bez naslova, meta-komentara, bez brojeva "scenarij 1/10".';

        $user = "Generiši samo taj otvor za oblast: {$label}.";

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
                'error' => 'Nije moguće učitati simulaciju. Proveri OPENAI_API_KEY u .env.',
            ], 503);
        }

        $text = trim($response->choices[0]->message->content);

        return response()->json([
            'mode' => 'conversation',
            'assistant_message' => $text,
        ]);
    }

    /**
     * Nastavak: poslednja poruka u nizu mora biti korisnička. Odgovor: JSON { reply, end_conversation }.
     */
    public function conversationTurn(Request $request)
    {
        $request->validate([
            'field' => 'required|in:medicine,psychology,economy,it',
            'user_turns' => 'required|integer|min:1|max:8',
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|in:assistant,user',
            'messages.*.content' => 'required|string|max:12000',
        ]);

        $field = $request->input('field');
        $label = self::FIELDS[$field];
        $userTurns = (int) $request->input('user_turns');
        $turnMessages = $request->input('messages');

        $last = $turnMessages[array_key_last($turnMessages)] ?? null;
        if (($last['role'] ?? '') !== 'user') {
            return response()->json([
                'error' => 'Poslednja poruka mora biti od korisnika.',
            ], 422);
        }

        if (! config('openai.api_key') && app()->environment('local')) {
            return response()->json($this->mockTurn($userTurns));
        }

        $forceEnd = $userTurns >= 2;
        $system = "Uloga: igraš klijenta/pacijenta/korisnika (NE savetnika) u kratkom edukativnom ćasku. Oblast: {$label}.\n"
            ."Pravila: najviše 2 rečenice po poruci. Cilj je kratak dijalog (ukupno 2–3 korisnička odgovora u celoj seansi).\n"
            ."Korisnički odgovori do sada u ovom razgovoru: {$userTurns}.\n";
        if ($forceEnd) {
            $system .= "SADA MORAŠ završiti: zahvati korisniku, kratka završna rečenica, bez novih pitanja. Nema dodatnih pitanja.\n";
        } else {
            $system .= "Ako korisnički odgovor nije dovoljno jasan, postavi JEDNO kratko dodatno pitanje. Ako je odgovor dobar, možeš zahvaliti i završiti (bez pitanja).\n";
        }
        $system .= 'Odgovor ISKLJUČIVO kao JSON: {"reply":"tvoj tekst u prvom licu","end_conversation": true ili false}';

        $apiMessages = [['role' => 'system', 'content' => $system]];
        foreach ($turnMessages as $m) {
            $r = $m['role'] === 'user' ? 'user' : 'assistant';
            $apiMessages[] = ['role' => $r, 'content' => $m['content']];
        }

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => $apiMessages,
                'response_format' => ['type' => 'json_object'],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'Nije moguće dobiti odgovor. Proveri OPENAI_API_KEY u .env.',
            ], 503);
        }

        $raw = $response->choices[0]->message->content;
        $data = is_string($raw) ? json_decode($raw, true) : [];
        if (! is_array($data)) {
            $data = [];
        }

        $reply = is_string($data['reply'] ?? null) ? trim($data['reply']) : 'Hvala, ovo pomaže.';
        if ($reply === '') {
            $reply = 'Hvala na pojašnjenju.';
        }
        $end = (bool) ($data['end_conversation'] ?? false);
        if ($forceEnd) {
            $end = true;
        }

        return response()->json([
            'assistant_message' => $reply,
            'end_conversation' => $end,
        ]);
    }

    public function evaluateAnswer(Request $request)
    {
        $request->validate([
            'field' => 'required|in:medicine,psychology,economy,it',
            'messages' => 'nullable|array',
            'messages.*.role' => 'required_with:messages|in:assistant,user',
            'messages.*.content' => 'required_with:messages|string|max:12000',
            'scenario_index' => 'nullable|integer|min:1|max:10',
            'scenario_text' => 'nullable|string|max:12000',
            'user_message' => 'nullable|string|max:8000',
        ]);

        $field = $request->input('field');
        $label = self::FIELDS[$field];
        $messages = $request->input('messages');

        if (is_array($messages) && count($messages) > 0) {
            $transcript = $this->formatTranscript($messages);
        } else {
            $scenarioText = (string) $request->input('scenario_text', '');
            $userMessage = (string) $request->input('user_message', '');
            if ($scenarioText === '' || $userMessage === '') {
                return response()->json([
                    'error' => 'Nedostaje transkript razgovora (messages) ili scenario_text + user_message.',
                ], 422);
            }
            $transcript = "Kontekst (klijent): {$scenarioText}\n\nPoslednji odgovor studenta: {$userMessage}";
        }

        if (! config('openai.api_key') && app()->environment('local')) {
            return response()->json($this->mockEvaluate());
        }

        $system = "Ti si iskusni edukator u oblasti: {$label}. "
            .'Student vodi kratki dijalog u ulozi stručnjaka; druga strana je korisnik/AI u ulozi "klijenta". '
            .'Oceni CELI prilog u razgovoru (kako student postavlja pitanja, daje smer, pokazuje razumevanje) skalom 0–10. '
            .'Vrati ISKLJUČIVO valjan JSON (bez markdown) u obliku: '
            .'{"score": number, "summary": "kratka fraza na srpskom", '
            .'"good": ["stvar 1", "stvar 2"], "improve": ["sugestija 1", "sugestija 2"], '
            .'"ideal": "Jedan pasus predloga na srpskom."} '
            .'good: 2–3 stavke, improve: 2–3 stavke.';

        $user = "Transkript razgovora (assistant = klijent, user = student):\n\n{$transcript}";

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
                'error' => 'Nije moguće oceniti. Proveri OPENAI_API_KEY u .env.',
            ], 503);
        }

        $raw = $response->choices[0]->message->content;
        $data = is_string($raw) ? json_decode($raw, true) : [];
        if (! is_array($data)) {
            $data = [];
        }

        $score = isset($data['score']) ? (float) $data['score'] : 7.0;
        $summary = is_string($data['summary'] ?? null) ? $data['summary'] : 'Povratna informacija';
        $good = is_array($data['good'] ?? null) ? $data['good'] : ['Dobar pristup u razgovoru.'];
        $improve = is_array($data['improve'] ?? null) ? $data['improve'] : ['Razmisli o dodatnom strukturisanju odgovora.'];
        $ideal = is_string($data['ideal'] ?? null) ? $data['ideal'] : 'Kratka potvrda, jedno pitanje, jasan sledeći korak.';

        return response()->json([
            'score' => min(10, max(0, $score)),
            'summary' => $summary,
            'good' => array_values($good),
            'improve' => array_values($improve),
            'ideal' => $ideal,
        ]);
    }

    private function formatTranscript(array $messages): string
    {
        $lines = [];
        foreach ($messages as $m) {
            $role = ($m['role'] ?? '') === 'user' ? 'Student' : 'Klijent';
            $content = is_string($m['content'] ?? null) ? trim($m['content']) : '';
            if ($content !== '') {
                $lines[] = $role.': '.$content;
            }
        }

        return implode("\n", $lines);
    }

    private function mockStart(): array
    {
        return [
            'mode' => 'conversation',
            'assistant_message' => 'Zdravo. Nisam siguran/na kako da pristupim problemu u poslednje vreme — gubim fokus. Možeš li u kratko reći kako tumačiš o čemu se radi?',
        ];
    }

    private function mockTurn(int $userTurns): array
    {
        if ($userTurns >= 2) {
            return [
                'assistant_message' => 'Hvala, ovo mi skoro pomaže. Srećno dalje!',
                'end_conversation' => true,
            ];
        }

        return [
            'assistant_message' => 'Razumem. A jesi li to već pokušao/la u praksi na jedan konkretan način?',
            'end_conversation' => false,
        ];
    }

    private function mockEvaluate(): array
    {
        return [
            'score' => 8.5,
            'summary' => 'Dobar prilog u kratkom razgovoru.',
            'good' => [
                'Jasno si odgovorio/la i pokazao/la pristup.',
                'Koristio/la si smislen redosled.',
            ],
            'improve' => [
                'Mogao/la bi još konkretnije povezati sa situacijom klijenta.',
            ],
            'ideal' => 'Kratka potvrda osećaja, jedan predlog, jedan mali naredni korak.',
        ];
    }
}
