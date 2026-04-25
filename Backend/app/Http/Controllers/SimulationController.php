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

        $system = 'Ti pripremaš otvor za edukativni, realan razgovor. Oblast: '.$label.'. '
            .'Kasnije: student daje smer/odgovor, ti (u narednim porukama) igraš klijenta, pacijenta ili korisnika uzevši u obzir ulogu oblasti. '
            .'Ova prva poruka: u prvom licu, 2 do 3 rečenice, konzistentna, uverljiva situacija, jedno jasno pitanje. '
            .'Izbegavaj nerealne skokove: ako pitaš o problemu, pitanje mora prirodno proizaći iz uvedene situacije. '
            .'Jezik: srpski. Bez naslova, meta-komentara, bez reči „scenarij 1/10”.';

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

    public function conversationTurn(Request $request)
    {
        $request->validate([
            'field' => 'required|in:medicine,psychology,economy,it',
            'user_turns' => 'required|integer|min:1|max:10',
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

        $system = "Uloga: igraš klijenta, pacijenta ili korisnika usluge (NE savetnika) u umereno kratkom, realnom dijalogu. Oblast: {$label}.\n\n"
            ."Istorija poruka iznad: drži se konteksta; odgovori logičan nastavak (ne ignoriši šta je student rekao, ne skači u novu temu bez povezivanja).\n"
            ."Dug razgovor nije obavezan: kad god ima smisla, možeš završiti — u prvom licu npr. da si zadovoljan/na smerom, da i dalje nisi, da ti je dovoljno za sada, ili zahvali. "
            ."Cilj završetka: prirodan osećaj (zatvaranje uzevši u obzir realnost uloge), a ne fiksirani broj poruka.\n"
            ."Ako završavaš, izbegavaj pitanja u istoj poruci. Ako ne završavaš, maks. jedno kratko pitanje ili jedan sledeći korak u 2 rečenice.\n"
            ."Korisnički odgovori do sada (student): {$userTurns}.\n\n";

        if ($userTurns >= 6) {
            $system .= "Napomena: razgovor je već dugačak. U ovoj poruci potrudi se da bude jasan, realan kraj: izrazi zadovoljstvo, umereno nezadovoljstvo, ili hvala i odluku da staneš, osim ako student baš pita nešto što zahteva jednu kratku poslednju reč.\n\n";
        }

        $system .= 'Izlaz ISKLJUČIVO JSON (bez markdown okvira): {"reply":"tvoj tekst u prvom licu","end_conversation": true ili false}';

        $hardEnd = $userTurns >= 9;

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
        if ($hardEnd) {
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
            .'Student vodi dijalog u ulozi stručnjaka; klijent može u jednom trenutku reći zadovoljstvo, nezadovoljstvo, zahvalu i zatvoriti — to je očekivano, ne greška. '
            .'Oceni CELI prilog: logičan tok, povezivanje sa rečima klijenta, kvalitet smera i empatija, skalom 0–10. '
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
        if ($userTurns >= 4) {
            return [
                'assistant_message' => 'Hvala, sada imam dosta jasnoću. Još nisam skroz spokojan/na, ali ovo mogu prvo probati — sada bih stao/la s razgovorom.',
                'end_conversation' => true,
            ];
        }
        if ($userTurns === 1) {
            return [
                'assistant_message' => 'Razumem, to ima smisla. A gde to najviše osećaš u svom danu, da znam u čemu bih očekivao/la pomoć?',
                'end_conversation' => false,
            ];
        }
        if ($userTurns === 2) {
            return [
                'assistant_message' => 'Dobro, ovo pomaže. I dalje imam osećaj da mi nešto fali, ali smer mi je sada jasniji nego pre.',
                'end_conversation' => false,
            ];
        }

        return [
            'assistant_message' => 'Hvala — sa ovim zasad mogu, zadovoljan/na sam. Ako bude trebalo, javiću se ponovo u drugu priliku.',
            'end_conversation' => true,
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
