'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function MemeGenerator({ onMemeGenerated }) {
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    style: 'classic',
    batch: 1,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await api.post('/meme/generate', {
        vibe,
        ...options,
      });
      
      onMemeGenerated(result.data);
    } catch (error) {
      console.error('Failed to generate meme:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
      <h2 className="text-2xl font-bold mb-4">Generate Meme</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Vibe / Theme
          </label>
          <input
            type="text"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="lazy cat Monday, crypto crash, dating apps..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Style
            </label>
            <select
              value={options.style}
              onChange={(e) => setOptions({ ...options, style: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="classic">Classic Meme</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Batch Size
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={options.batch}
              onChange={(e) => setOptions({ ...options, batch: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={loading || !vibe}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Meme Pack 🚀'}
        </button>
      </div>
    </div>
  );
}
