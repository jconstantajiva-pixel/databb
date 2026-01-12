
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Contact, AIInsight } from './types';
import { ContactCard } from './components/ContactCard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { analyzeContacts } from './services/geminiService';

const App: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('local');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const loadLocalData = useCallback(() => {
    try {
      const saved = localStorage.getItem('contacts_backup');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await fetch('/api/contacts', { 
          signal: AbortSignal.timeout(3000) 
        });
        
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
          setStorageMode('cloud');
        } else {
          throw new Error();
        }
      } catch (error) {
        setContacts(loadLocalData());
        setStorageMode('local');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadLocalData]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('contacts_backup', JSON.stringify(contacts));
    }
  }, [contacts, isLoading]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const tempId = Math.random().toString(36).substr(2, 9);
    const newContactData = {
      name: name.trim(),
      address: address.trim(),
      createdAt: Date.now(),
    };

    if (storageMode === 'cloud') {
      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newContactData)
        });

        if (response.ok) {
          const savedContact = await response.json();
          setContacts(prev => [savedContact, ...prev]);
        } else {
          throw new Error();
        }
      } catch (error) {
        setContacts(prev => [{ ...newContactData, id: tempId }, ...prev]);
      }
    } else {
      setContacts(prev => [{ ...newContactData, id: tempId }, ...prev]);
    }

    setName('');
    setAddress('');
    setShowAddForm(false);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    if (storageMode === 'cloud') {
      try {
        const response = await fetch(`/api/contacts/${contactToDelete.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
        }
      } catch (error) {
        setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
      }
    } else {
      setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
    }
    setContactToDelete(null);
  };

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.address.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleAIAnalyze = async () => {
    if (contacts.length === 0) return;
    setIsAnalyzing(true);
    try {
      const insight = await analyzeContacts(contacts);
      setAiInsight(insight);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900">
      <ConfirmationModal 
        isOpen={!!contactToDelete}
        title="Confirmați ștergerea"
        message={`Sunteți sigur că doriți să ștergeți contactul "${contactToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setContactToDelete(null)}
      />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-database text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SmartContact</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${storageMode === 'cloud' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {storageMode === 'cloud' ? 'Sincronizat Cloud' : 'Stocare Locală'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleAIAnalyze}
            disabled={isAnalyzing || contacts.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
          >
            <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            <span className="hidden sm:inline">Analiză AI</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full bg-white p-8 rounded-2xl shadow-sm border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center gap-4 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-plus text-xl"></i>
              </div>
              <span className="font-bold">Adaugă Contact</span>
            </button>
          ) : (
            <section className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <i className="fas fa-user-plus text-indigo-500"></i>
                  Contact Nou
                </h2>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleAddContact} className="space-y-4">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nume Complet"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adresă"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  Salvează
                </button>
              </form>
            </section>
          )}

          {aiInsight && (
            <section className="bg-indigo-900 p-6 rounded-2xl shadow-xl text-white fade-in">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <i className="fas fa-sparkles text-amber-400"></i>
                  Insight AI
                </h3>
                <button onClick={() => setAiInsight(null)} className="text-indigo-300 hover:text-white">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed mb-4">{aiInsight.summary}</p>
              <div className="space-y-2">
                {aiInsight.suggestions.map((s, idx) => (
                  <div key={idx} className="text-xs bg-white/10 p-2 rounded-lg border border-white/5">
                    • {s}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Caută în listă..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
            />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">
                <i className="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
                <p className="text-sm">Se încarcă...</p>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <ContactCard 
                  key={contact.id} 
                  contact={contact} 
                  onDelete={() => setContactToDelete(contact)} 
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
                <i className="fas fa-folder-open text-3xl mb-3 opacity-20"></i>
                <p>Niciun contact găsit</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
