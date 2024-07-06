import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const FileEditor = ({ filename }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFile();
  }, [filename]);

  const loadFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/file/${filename}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to load file');
      }
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async () => {
    try {
      const response = await fetch(`/api/file/${filename}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Failed to save file');
      }
      alert('File saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditorChange = (value) => {
    setContent(value);
  };

  if (isLoading) return <div className="text-white">Loading file...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
      <Editor
        height="400px"
        language="javascript"
        theme="vs-dark"
        value={content}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
        }}
      />
      <div className="flex justify-end p-4 bg-[#252526]">
        <button
          onClick={saveFile}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default FileEditor;