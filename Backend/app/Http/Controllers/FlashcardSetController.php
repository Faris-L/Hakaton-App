<?php

namespace App\Http\Controllers;

use App\Models\FlashcardSet;
use Illuminate\Http\Request;

class FlashcardSetController extends Controller
{
    private const SUBJECTS = ['medicine', 'psychology', 'economy', 'it'];

    private function userKeyFrom(Request $request): ?string
    {
        $k = trim((string) $request->header('X-Nexora-User', ''));

        return $k !== '' ? $k : null;
    }

    private function findSetForUser(int $id, string $userKey): ?FlashcardSet
    {
        return FlashcardSet::query()
            ->where('id', $id)
            ->where('user_key', $userKey)
            ->first();
    }

    public function index(Request $request)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $subject = $request->query('subject');
        $q = FlashcardSet::query()
            ->where('user_key', $userKey)
            ->withCount('cards');
        if (is_string($subject) && $subject !== '' && in_array($subject, self::SUBJECTS, true)) {
            $q->where('subject', $subject);
        }

        $sets = $q->orderByDesc('created_at')->get();

        return response()->json($sets->map(function (FlashcardSet $s) {
            return array_merge($s->toArray(), [
                'cards_count' => (int) $s->cards_count,
            ]);
        }));
    }

    public function show(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $set = $this->findSetForUser($id, $userKey);
        if (! $set) {
            return response()->json(['error' => 'Set nije pronađen.'], 404);
        }
        $set->load('cards');
        $arr = $set->toArray();
        $arr['cards_count'] = $set->cards->count();

        return response()->json($arr);
    }

    public function store(Request $request)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $data = $request->validate([
            'title' => 'required|string|max:500',
            'subject' => 'required|string|in:'.implode(',', self::SUBJECTS),
            'description' => 'nullable|string|max:20000',
            'cards' => 'nullable|array|max:200',
            'cards.*.question' => 'required_with:cards|string|max:2000',
            'cards.*.answer' => 'required_with:cards|string|max:2000',
            'cards.*.difficulty' => 'required_with:cards|string|in:easy,medium,hard',
        ]);

        $set = FlashcardSet::create([
            'user_key' => $userKey,
            'title' => $data['title'],
            'subject' => $data['subject'],
            'description' => $data['description'] ?? null,
        ]);

        if (! empty($data['cards']) && is_array($data['cards'])) {
            foreach ($data['cards'] as $c) {
                $set->cards()->create([
                    'question' => $c['question'],
                    'answer' => $c['answer'],
                    'difficulty' => $c['difficulty'],
                ]);
            }
        }

        $set->load('cards');
        $arr = $set->toArray();
        $arr['cards_count'] = $set->cards->count();

        return response()->json($arr, 201);
    }

    public function update(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $set = $this->findSetForUser($id, $userKey);
        if (! $set) {
            return response()->json(['error' => 'Set nije pronađen.'], 404);
        }

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:500',
            'subject' => 'sometimes|required|string|in:'.implode(',', self::SUBJECTS),
            'description' => 'nullable|string|max:20000',
        ]);

        $set->update($data);
        $set->load('cards');
        $arr = $set->toArray();
        $arr['cards_count'] = $set->cards->count();

        return response()->json($arr);
    }

    public function destroy(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $set = $this->findSetForUser($id, $userKey);
        if (! $set) {
            return response()->json(['error' => 'Set nije pronađen.'], 404);
        }
        $set->delete();

        return response()->json(['ok' => true]);
    }

    public function addCards(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $set = $this->findSetForUser($id, $userKey);
        if (! $set) {
            return response()->json(['error' => 'Set nije pronađen.'], 404);
        }

        $data = $request->validate([
            'cards' => 'required|array|min:1|max:100',
            'cards.*.question' => 'required|string|max:2000',
            'cards.*.answer' => 'required|string|max:2000',
            'cards.*.difficulty' => 'required|string|in:easy,medium,hard',
        ]);

        $created = [];
        foreach ($data['cards'] as $c) {
            $created[] = $set->cards()->create([
                'question' => $c['question'],
                'answer' => $c['answer'],
                'difficulty' => $c['difficulty'],
            ]);
        }

        return response()->json(['cards' => $created], 201);
    }
}
