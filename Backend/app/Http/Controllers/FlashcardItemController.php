<?php

namespace App\Http\Controllers;

use App\Models\Flashcard;
use Illuminate\Http\Request;

class FlashcardItemController extends Controller
{
    private function userKeyFrom(Request $request): ?string
    {
        $k = trim((string) $request->header('X-Nexora-User', ''));

        return $k !== '' ? $k : null;
    }

    public function update(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $card = Flashcard::query()->with('flashcardSet')->find($id);
        if (! $card || $card->flashcardSet->user_key !== $userKey) {
            return response()->json(['error' => 'Kartica nije pronađena.'], 404);
        }

        $data = $request->validate([
            'question' => 'required|string|max:2000',
            'answer' => 'required|string|max:2000',
            'difficulty' => 'required|string|in:easy,medium,hard',
        ]);

        $card->update($data);

        return response()->json($card->fresh());
    }

    public function destroy(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $card = Flashcard::query()->with('flashcardSet')->find($id);
        if (! $card || $card->flashcardSet->user_key !== $userKey) {
            return response()->json(['error' => 'Kartica nije pronađena.'], 404);
        }
        $card->delete();

        return response()->json(['ok' => true]);
    }
}
