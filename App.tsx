
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Contact, AIInsight } from './types';
import { ContactCard } from './components/ContactCard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { analyzeContacts } from './services/geminiService';

const App: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Stare pentru gestionarea ștergerii cu confirmare
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      address: address.trim(),
      createdAt: Date.now(),
    };

    setContacts(prev => [newContact, ...prev]);
    setName('');
    setAddress('');
    setShowAddForm(false); // Închide formularul după adăugare
  };

  const requestDeleteContact = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      setContactToDelete(contact);
    }
  }, [contacts]);

  const confirmDelete = () => {
    if (contactToDelete) {
      setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
      setContactToDelete(null);
    }
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
    <div className="min-h-screen pb-20">
      <ConfirmationModal 
        isOpen={!!contactToDelete}
        title="Confirmați ștergerea"
        message={`Sunteți sigur că doriți să ștergeți contactul "${contactToDelete?.name}"? Această acțiune nu poate fi anulată.`}
        onConfirm={confirmDelete}
        onCancel={() => setContactToDelete(null)}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-address-book text-xl"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">SmartContact</h1>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || contacts.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
              {isAnalyzing ? 'Analiză...' : 'Perspectivă AI'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Toggles & Insights */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Action Button */}
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center gap-3 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-plus text-xl"></i>
              </div>
              <span className="font-bold text-lg uppercase tracking-wide">Adaugă Produs</span>
            </button>
          ) : (
            <section className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-plus-circle text-indigo-500"></i>
                  Adaugă Contact Nou
                </h2>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nume Complet</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ion Popescu"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adresă</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Str. Florilor nr. 10, București"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Renunță
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    Salvează Contact
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* AI Insights Display */}
          {aiInsight && (
            <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <i className="fas fa-bolt text-amber-300"></i>
                  Inteligență Artficială
                </h3>
                <button onClick={() => setAiInsight(null)} className="text-indigo-200 hover:text-white">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p className="text-indigo-50 text-sm leading-relaxed mb-4 italic">
                "{aiInsight.summary}"
              </p>
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold tracking-widest text-indigo-300">Sugestii</p>
                {aiInsight.suggestions.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm bg-white/10 p-2 rounded-lg">
                    <span className="text-amber-400">•</span>
                    {s}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: List & Search */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Caută după nume sau adresă..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <div className="text-sm text-slate-500 whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded-lg font-medium">
              {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacte'}
            </div>
          </section>

          <section className="space-y-4">
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <ContactCard 
                  key={contact.id} 
                  contact={contact} 
                  onDelete={requestDeleteContact} 
                />
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <i className="fas fa-search text-3xl"></i>
                </div>
                <h3 className="text-slate-600 font-semibold text-lg">Niciun rezultat găsit</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
                  Încearcă să modifici termenii de căutare sau adaugă un contact nou.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
