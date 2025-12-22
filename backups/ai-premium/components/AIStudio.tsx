
import React, { useState } from 'react';
import { generateImage, generateVideo } from '../services/geminiService';
import { GenerationStatus, GeneratedAsset } from '../types';

const AIStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [assetType, setAssetType] = useState<'image' | 'video'>('image');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [results, setResults] = useState<GeneratedAsset[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus('generating');
    try {
      let url = '';
      if (assetType === 'image') {
        url = await generateImage(prompt, aspectRatio, imageSize);
      } else {
        url = await generateVideo(prompt, aspectRatio as any);
      }
      
      const newAsset: GeneratedAsset = { type: assetType, url, prompt };
      setResults(prev => [newAsset, ...prev]);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <section id="ai-studio" className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-900/20 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <span className="text-brand-400 font-bold tracking-widest uppercase text-xs mb-2 block">Laboratorio Creativo</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Imagínate en Valencia</h2>
          <p className="text-slate-400 max-w-2xl text-lg">
            Usa nuestra tecnología generativa para visualizar tu estancia perfecta o crea postales únicas de la ciudad.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-dark p-8 rounded-3xl space-y-6">
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setAssetType('image')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${assetType === 'image' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  Imagen HD
                </button>
                <button 
                  onClick={() => setAssetType('video')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${assetType === 'video' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  Video Realista
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Describe tu visión</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Un atardecer dorado sobre la Ciudad de las Artes y las Ciencias con estilo cinemático..."
                  className="w-full h-32 bg-slate-800 border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 ring-brand-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Aspect Ratio</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-sm outline-none"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="4:3">4:3 Photo</option>
                  </select>
                </div>
                {assetType === 'image' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Calidad</label>
                    <select 
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-sm outline-none"
                    >
                      <option value="1K">1K Standard</option>
                      <option value="2K">2K High Res</option>
                      <option value="4K">4K Ultra HD</option>
                    </select>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={status === 'generating'}
                className={`w-full py-4 rounded-2xl font-bold transition-all shadow-xl shadow-brand-900/20 flex items-center justify-center gap-3 ${status === 'generating' ? 'bg-slate-700 cursor-wait' : 'bg-brand-600 hover:bg-brand-500 active:scale-95'}`}
              >
                {status === 'generating' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sandra está creando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Generar ahora
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-6">
              {results.length === 0 && (
                <div className="h-full min-h-[400px] border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-slate-300">Galería Vacía</h4>
                  <p className="text-sm max-w-xs mt-2">Introduce un prompt a la izquierda para ver la magia de la IA en acción.</p>
                </div>
              )}
              {results.map((asset, i) => (
                <div key={i} className="group relative bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.prompt} className="w-full h-auto object-cover" />
                  ) : (
                    <video src={asset.url} controls className="w-full h-auto" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                    <p className="text-sm font-medium text-slate-200 line-clamp-2">{asset.prompt}</p>
                    <div className="mt-4 flex gap-3">
                      <a href={asset.url} download className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors">Descargar</a>
                      <button className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-600">Compartir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIStudio;
