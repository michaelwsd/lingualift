'use client';

import { PassageFill } from '@/components/homework/PassageFill';
import { PassageFillExercise } from '@/types';

// TEMPORARY verification harness: the real broken exercise from assignment 74cf1f4d
// (student Ziwang Chen), whose passage contains the mistyped marker `__BLAK_4__`.
const EXERCISE: PassageFillExercise = {
  id: 'passage_fill_0',
  wordIds: [],
  answers: ['undeniable', 'striker', 'relentless', 'honed', 'physique', 'prolific', 'formidable'],
  passage:
    'Maria was a rising star in her local football club. Her talent was __BLANK_0__; anyone who watched her play could see her incredible skill. As a dedicated __BLANK_1__, Maria spent hours practicing her shots and perfecting her game. Her training routine was __BLANK_2__, pushing her to her limits every single day. Over many years, her dribbling and passing skills were perfectly __BLANK_3__, making her a key player. Maria also worked hard on her body; her strong, athletic __BLAK_4__ helped her run faster and jump higher. She was a truly __BLANK_5__ goal-scorer, often netting multiple goals in one match. Because of her speed and power, she was a __BLANK_6__ opponent for any team, difficult to defend against.',
  wordBank: [
    'debut', 'testament', 'guidance', 'prolific', 'stunning', 'tallies', 'treble',
    'shattered', 'astonishing', 'honed', 'breed', 'impressing', 'formidable',
    'blistering', 'striker', 'scouts', 'securing', 'insatiable', 'meteoric',
    'clinical', 'ambition', 'pivotal', 'undeniable', 'relentless', 'physique', 'exploded',
  ],
};

export default function BlankHarness() {
  return (
    <div className="p-8">
      <PassageFill
        exercise={EXERCISE}
        onComplete={allCorrect => {
          (window as unknown as { __completed?: boolean }).__completed = allCorrect;
        }}
      />
    </div>
  );
}
