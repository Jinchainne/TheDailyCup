import { useLocalStorage } from './useLocalStorage';

export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

export function useContacts() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', []);

  const addContact = (name: string, address: string) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name,
      address,
      createdAt: Date.now(),
    };
    setContacts(prev => [newContact, ...prev]);
    return newContact;
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return { contacts, addContact, removeContact };
}

