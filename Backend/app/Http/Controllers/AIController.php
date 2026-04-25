<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;

class AIController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'system' => 'nullable|string|max:12000',
        ]);

        $messages = [];
        if ($request->filled('system')) {
            $messages[] = [
                'role' => 'system',
                'content' => (string) $request->string('system'),
            ];
        }
        $messages[] = [
            'role' => 'user',
            'content' => (string) $request->string('message'),
        ];

        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
        ]);

        return response()->json([
            'reply' => $response->choices[0]->message->content
        ]);
    }
}
