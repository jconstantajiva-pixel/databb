
import React from 'react';
import { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
  onDelete: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onDelete }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start transition-all hover:shadow-md hover:border-indigo-100 group">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-slate-900 font-semibold text-lg">{contact.name}</h3>
          <p className="text-slate-500 flex items-center gap-1 mt-1">
            <i className="fas fa-map-marker-alt text-xs"></i>
            {contact.address}
          </p>
          <span className="text-[10px] text-slate-400 mt-2 block uppercase tracking-wider">
            Adăugat la {new Date(contact.createdAt).toLocaleDateString('ro-RO')}
          </span>
        </div>
      </div>
      <button 
        onClick={() => onDelete(contact.id)}
        className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        title="Șterge contact"
      >
        <i className="fas fa-trash-can"></i>
      </button>
    </div>
  );
};
