<?php

namespace Database\Seeders;

use App\Models\Lecture;
use Illuminate\Database\Seeder;

class LecturesSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'title' => 'Uvod u fiziologiju',
                'description' => 'Kratka priprema: srčana funkcija, krvni pritisak, osnove dijagnoze.',
                'subject' => 'medicine',
                'duration' => '18 min',
                'type' => 'audio',
                'file_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'video_url' => null,
            ],
            [
                'title' => 'Kognitivno ponašanje u stresu',
                'description' => 'Kako stres menja fokus; saveti studentima za ispitne nedelje.',
                'subject' => 'psychology',
                'duration' => '12 min',
                'type' => 'audio',
                'file_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                'video_url' => null,
            ],
            [
                'title' => 'Ponuda i tržišna cena',
                'description' => 'Osnove ponude, potražnje, ravnoteže — primeri iz stvarnog života.',
                'subject' => 'economy',
                'duration' => '9 min',
                'type' => 'video',
                'file_url' => null,
                'video_url' => 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
            ],
            [
                'title' => 'Nizovi u JavaScriptu',
                'description' => 'Map, filter, immutability — bazični pristupi za pripremu koda.',
                'subject' => 'it',
                'duration' => '15 min',
                'type' => 'video',
                'file_url' => null,
                'video_url' => 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
            ],
        ];
        foreach ($rows as $r) {
            Lecture::query()->updateOrCreate(
                ['title' => $r['title']],
                $r
            );
        }
    }
}
