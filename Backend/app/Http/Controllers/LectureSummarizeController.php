<?php

namespace App\Http\Controllers;

use App\Models\Lecture;
use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class LectureSummarizeController extends Controller
{
    public function summarize(Request $request)
    {
        $data = $request->validate([
            'lecture_id' => 'required|integer|exists:lectures,id',
        ]);
        $lecture = Lecture::query()->findOrFail($data['lecture_id']);

        $line = 'Naslov: '.$lecture->title
            ."\nTrajanje: ".$lecture->duration
            ."\nTip: ".$lecture->type
            ."\n\nOpis:\n".(string) $lecture->description;

        $system = 'Sažmi ovo učenja predavanje u 3–5 kratkih rečenica na srpskom (latinica). '.
            'Pisi neutralno, kao uvod. Ne praviti pitanja, kartice, skripte niti povezivati s drugim alatima.';

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $line],
                ],
                'max_tokens' => 500,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['error' => 'Sažetak trenutno nije dostupan.'], 503);
        }

        $text = $response->choices[0]->message->content ?? '';

        return response()->json(['summary' => is_string($text) ? trim($text) : '']);
    }
}
