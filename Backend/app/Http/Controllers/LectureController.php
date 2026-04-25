<?php

namespace App\Http\Controllers;

use App\Models\Lecture;
use Illuminate\Http\Request;

class LectureController extends Controller
{
    private const SUBJECTS = ['medicine', 'psychology', 'economy', 'it'];

    public function index(Request $request)
    {
        $subject = $request->query('subject');
        $q = Lecture::query()->orderByDesc('created_at');
        if (is_string($subject) && $subject !== '' && in_array($subject, self::SUBJECTS, true)) {
            $q->where('subject', $subject);
        }

        return response()->json($q->get());
    }

    public function show(int $id)
    {
        $lecture = Lecture::query()->find($id);
        if (! $lecture) {
            return response()->json(['error' => 'Predavanje nije pronađeno.'], 404);
        }

        return response()->json($lecture);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request, false);
        if (is_int($data)) {
            return response()->json(['error' => 'Nedostaje URL medija.'], 422);
        }
        $lecture = Lecture::create($data);

        return response()->json($lecture, 201);
    }

    public function update(Request $request, int $id)
    {
        $lecture = Lecture::query()->find($id);
        if (! $lecture) {
            return response()->json(['error' => 'Predavanje nije pronađeno.'], 404);
        }
        $data = $this->validatePayload($request, true, $lecture);
        if (is_int($data)) {
            return response()->json(['error' => 'Nedostaje URL medija.'], 422);
        }
        $lecture->update($data);

        return response()->json($lecture->fresh());
    }

    public function destroy(int $id)
    {
        $lecture = Lecture::query()->find($id);
        if (! $lecture) {
            return response()->json(['error' => 'Predavanje nije pronađeno.'], 404);
        }
        $lecture->delete();

        return response()->json(['ok' => true]);
    }

    private function validatePayload(Request $request, bool $isUpdate, ?Lecture $current = null): array|int
    {
        $fields = [
            'title' => 'required|string|max:500',
            'description' => 'nullable|string|max:20000',
            'subject' => 'required|string|in:'.implode(',', self::SUBJECTS),
            'duration' => 'required|string|max:64',
            'type' => 'required|string|in:audio,video',
            'file_url' => 'nullable|string|max:2048',
            'video_url' => 'nullable|string|max:2048',
        ];
        if ($isUpdate) {
            $rules = array_map(
                static fn (string $rule) => 'sometimes|'.$rule,
                $fields
            );
            $data = $request->validate($rules);
        } else {
            $data = $request->validate($fields);
        }

        $type = $data['type'] ?? $current?->type;
        $file = $data['file_url'] ?? $current?->file_url;
        $video = $data['video_url'] ?? $current?->video_url;

        if ($type === 'audio' && ($file === null || $file === '')) {
            return 422;
        }
        if ($type === 'video' && ($video === null || $video === '')) {
            return 422;
        }

        return $data;
    }
}
