import { useState } from 'react';
import axios from 'axios';

export default function TicketForm() {
  const [ticket, setTicket] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/tickets', { message: ticket });
      alert('Ticket enviado!');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={ticket}
        onChange={(e) => setTicket(e.target.value)}
        placeholder="Describe tu problema..."
      />
      <button type="submit">Enviar</button>
    </form>
  );
} 