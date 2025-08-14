'use client';

import { useState } from 'react';
import { MemeGenerator } from '@/components/MemeGenerator';
import { MemeGallery } from '@/components/MemeGallery';
import { PublishModal } from '@/components/PublishModal';

export default function Home() {
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-white text-center mb-12">
          AI Meme Generator 🔥
        </h1>
        
        <MemeGenerator 
          onMemeGenerated={(meme) => {
            setSelectedMeme(meme);
            setIsPublishModalOpen(true);
          }}
        />
        
        <MemeGallery 
          onSelectMeme={(meme) => {
            setSelectedMeme(meme);
            setIsPublishModalOpen(true);
          }}
        />
        
        {isPublishModalOpen && (
          <PublishModal
            meme={selectedMeme}
            onClose={() => setIsPublishModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
