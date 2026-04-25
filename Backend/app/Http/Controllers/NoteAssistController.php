<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class NoteAssistController extends Controller
{
    /**
     * Lagana pomoć oko pisanja beleške — proširuje/uredi tekst, bez drugih formata.
     */
    public function assist(Request $request)
    {
        $data = $request->validate([
            'text' => 'required|string|min:1|max:8000',
        ]);

        $draft = $data['text'];

        $system = <<<'SYS'
Si pomoćnik pri pisanju studentskih beleški. Korisnik daje temu, skicu ili par rečenica.
Zadatak: blago proširi, sredi u čitak tekst i pojašni gde treba, na istom jeziku kao korisnik (npr. srpski, hrvatski, bosanski).
OBAVEZNO: Ne smeš praviti pitanja sa ponuđenim odgovorima, flash kartice, skripte, uloge, simulacije, kviz, numerisane lekcije za drugi modul.
Dozvoljeno: kratke liste ili pasusi kao obična beleška.
Izlaz: samo gotov tekst beleške, bez “Evo:” u uvodu osim ako prirodno stane.
SYS;

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $draft],
                ],
                'max_tokens' => 2000,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['error' => 'AI pomoć trenutno nije dostupna.'], 503);
        }

        $text = $response->choices[0]->message->content ?? '';

        return response()->json(['text' => is_string($text) ? $text : '']);
    }
}
