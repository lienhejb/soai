'use client';

import { useState } from 'react';
import { OwnerPicker } from './OwnerPicker';
import { RecorderIdle } from './RecorderIdle';
import { RecorderActive } from './RecorderActive';
import { RecorderReview } from './RecorderReview';
import type {
  Ancestor,
  RecordingScript,
  RecordingStep,
  VoiceOwner,
} from './types';

interface Props {
  ancestors: Ancestor[];
  script: RecordingScript;
}

export function VoiceRecorder({ ancestors, script }: Props) {
  const [step, setStep] = useState<RecordingStep>('owner');
  const [owner, setOwner] = useState<VoiceOwner | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // MOCK: thay bằng MediaRecorder thật sau
  function handleStart() {
    setStep('recording');
  }

  function handleStop() {
    // MOCK: giả lập audioUrl, sau này set từ MediaRecorder blob
    setAudioUrl('/audio/mock-recording.mp3');
    setStep('review');
  }

  function handleRetry() {
    setAudioUrl('');
    setStep('idle');
  }

  async function handleSave() {
    if (!owner || !audioUrl) return;
    setIsSaving(true);
    // TODO: Server Action upload blob → Storage → insert voice_profiles → call provider
    console.log('SAVE', { owner, audioUrl });
    await new Promise((r) => setTimeout(r, 1500));
    setIsSaving(false);
    // TODO: router.push('/profile') hoặc toast success
  }

  return (
    <div className="mx-auto max-w-xl">
      {step === 'owner' && (
        <OwnerPicker
          ancestors={ancestors}
          onSelect={(o) => {
            setOwner(o);
            setStep('idle');
          }}
        />
      )}

      {step === 'idle' && owner && (
        <RecorderIdle
          owner={owner}
          script={script}
          onStart={handleStart}
          onBack={() => setStep('owner')}
        />
      )}

      {step === 'recording' && (
        <RecorderActive script={script} onStop={handleStop} />
      )}

      {step === 'review' && owner && (
        <RecorderReview
          owner={owner}
          audioUrl={audioUrl}
          onRetry={handleRetry}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}