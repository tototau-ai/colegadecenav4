import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import ScriptReader from './components/ScriptReader';

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');

  return (
    <div className="w-full h-full">
      {view === 'landing' ? (
        <LandingPage onStart={() => setView('app')} />
      ) : (
        <ScriptReader onBack={() => setView('landing')} />
      )}
    </div>
  );
}