import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// --- Configuration ---
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'; // The address of our FastAPI backend

// --- Interfaces ---
interface Note {
  id: string;
  text: string;
}

// --- Main App Component ---
function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API Communication Hooks ---
  const fetchNotes = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/notes/`);
      if (!response.ok) {
        throw new Error('Failed to fetch notes. Is the backend server running?');
      }
      const data: Note[] = await response.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // --- Event Handlers ---
  const addNote = async (text: string) => {
    if (text.trim() === '') return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error('Failed to add note.');
      }
      setNewNoteText('');
      await fetchNotes(); // Re-fetch notes to display the new one
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete note.');
      }
      await fetchNotes(); // Re-fetch notes to update the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/extract-text/`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to extract text from image.');
      }
      const result = await response.json();
      await addNote(result.text); // Add the extracted text as a new note
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getAiInsight = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-insights/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to get AI insight.');
      }
      const result = await response.json();
      // Add the insight as a new note for visibility
      await addNote(`AI Insight:\n${result.insight}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  // --- Render ---
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-logo">CogniNote</h1>
        <div className="header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button className="upload-btn" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Upload Image'}
          </button>
        </div>
      </header>
      <main className="App-main">
        {error && <p className="error-message">Error: {error}</p>}
        {isLoading && <div className="spinner"></div>}
        <div className="add-note-container">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="What's on your mind?"
            className="note-textarea new-note-input"
            disabled={isLoading}
          />
          <button className="add-note-btn" onClick={() => addNote(newNoteText)} disabled={isLoading}>+</button>
        </div>
        <div className="notes-grid">
          {notes.map(note => (
            <div key={note.id} className="note">
              <p>{note.text}</p>
              <div className="note-footer">
                <button className="ai-insight-btn" onClick={() => getAiInsight(note.text)} disabled={isLoading}>Get AI Insight</button>
                <button className="delete-btn" onClick={() => deleteNote(note.id)} disabled={isLoading}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;