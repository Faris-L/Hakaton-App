<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    private const SUBJECTS = ['medicine', 'psychology', 'economy', 'it'];

    private function userKeyFrom(Request $request): ?string
    {
        $k = (string) $request->header('X-Nexora-User', '');
        $k = trim($k);

        return $k !== '' ? $k : null;
    }

    public function index(Request $request)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $subject = $request->query('subject');
        $q = Note::query()->where('user_key', $userKey);
        if (is_string($subject) && $subject !== '' && in_array($subject, self::SUBJECTS, true)) {
            $q->where('subject', $subject);
        }

        $notes = $q->orderByDesc('created_at')->get();

        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $data = $request->validate([
            'title' => 'required|string|max:500',
            'content' => 'nullable|string|max:100000',
            'subject' => 'required|string|in:'.implode(',', self::SUBJECTS),
        ]);

        $note = Note::create([
            'user_key' => $userKey,
            'title' => $data['title'],
            'content' => $data['content'] ?? '',
            'subject' => $data['subject'],
        ]);

        return response()->json($note, 201);
    }

    public function update(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $note = Note::where('id', $id)->where('user_key', $userKey)->first();
        if (! $note) {
            return response()->json(['error' => 'Beleška nije pronađena.'], 404);
        }

        $data = $request->validate([
            'title' => 'required|string|max:500',
            'content' => 'nullable|string|max:100000',
            'subject' => 'required|string|in:'.implode(',', self::SUBJECTS),
        ]);

        $note->update([
            'title' => $data['title'],
            'content' => $data['content'] ?? '',
            'subject' => $data['subject'],
        ]);

        return response()->json($note);
    }

    public function destroy(Request $request, int $id)
    {
        $userKey = $this->userKeyFrom($request);
        if (! $userKey) {
            return response()->json(['error' => 'Nedostaje korisnički kontekst (X-Nexora-User).'], 401);
        }

        $note = Note::where('id', $id)->where('user_key', $userKey)->first();
        if (! $note) {
            return response()->json(['error' => 'Beleška nije pronađena.'], 404);
        }

        $note->delete();

        return response()->json(['ok' => true]);
    }
}
