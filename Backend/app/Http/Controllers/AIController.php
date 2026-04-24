<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;

class AIController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'user', 'content' => $request->message],
            ],
        ]);

        return response()->json([
            'reply' => $response->choices[0]->message->content
        ]);
    }
}
