/**
 * React Component Example - Realtime Voice System
 *
 * Usage:
 * <RealtimeVoiceWidget
 *   serverUrl="ws://localhost:4042"
 *   onTranscription={(text) => console.log(text)}
 *   onResponse={(text) => console.log(text)}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import { RealtimeVoiceClient } from '../core/client/src/realtime-voice-client';

const RealtimeVoiceWidget = ({
  serverUrl = 'ws://localhost:4042',
  language = 'es',
  autoConnect = false,
  onTranscription = null,
  onResponse = null,
  onError = null,
  debug = false
}) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [logs, setLogs] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedProvider, setSelectedProvider] = useState('gemini');

  // Refs
  const clientRef = useRef(null);
  const logsRef = useRef([]);

  // Log function
  const addLog = (category, message, data = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${category}: ${message}${data ? ' - ' + data : ''}`;

    logsRef.current = [logEntry, ...logsRef.current.slice(0, 19)]; // Keep last 20 logs
    setLogs([...logsRef.current]);

    if (debug) {
      console.log(logEntry);
    }
  };

  // Connect to server
  const handleConnect = async () => {
    try {
      addLog('CONEXIÓN', 'Conectando...');

      clientRef.current = new RealtimeVoiceClient({
        serverUrl,
        language: selectedLanguage,
        debug
      });

      // Setup event listeners
      clientRef.current.on('ready', () => {
        addLog('EVENTO', 'Conectado y listo');
        setIsConnected(true);
      });

      clientRef.current.on('listening_started', () => {
        addLog('AUDIO', 'Micrófono activado');
        setIsListening(true);
      });

      clientRef.current.on('listening_stopped', () => {
        addLog('AUDIO', 'Micrófono desactivado');
        setIsListening(false);
      });

      clientRef.current.on('transcription', (text) => {
        addLog('TRANSCRIPCIÓN', text);
        setTranscription(text);
        if (onTranscription) {
          onTranscription(text);
        }
      });

      clientRef.current.on('text', (chunk) => {
        addLog('RESPUESTA', chunk.substring(0, 50) + '...');
        setResponse(prev => prev + chunk);
        if (onResponse) {
          onResponse(chunk);
        }
      });

      clientRef.current.on('response_complete', () => {
        addLog('EVENTO', 'Respuesta completada');
        setIsProcessing(false);
      });

      clientRef.current.on('error', (error) => {
        addLog('ERROR', error.message || 'Error desconocido');
        if (onError) {
          onError(error);
        }
      });

      clientRef.current.on('disconnected', () => {
        addLog('EVENTO', 'Desconectado');
        setIsConnected(false);
        setIsListening(false);
      });

      // Connect
      await clientRef.current.connect();
      addLog('CONEXIÓN', 'Conectado exitosamente');
      setIsConnected(true);

    } catch (error) {
      addLog('ERROR', 'Conexión fallida', error.message);
      setIsConnected(false);
    }
  };

  // Start listening
  const handleStartListening = async () => {
    try {
      if (!clientRef.current || !isConnected) {
        addLog('ERROR', 'No conectado al servidor');
        return;
      }

      addLog('AUDIO', 'Solicitando acceso al micrófono...');
      setTranscription('');
      setResponse('');

      await clientRef.current.startListening();
      setIsListening(true);

    } catch (error) {
      addLog('ERROR', 'No se pudo acceder al micrófono', error.message);
    }
  };

  // Stop listening
  const handleStopListening = () => {
    if (clientRef.current) {
      clientRef.current.stopListening();
      setIsListening(false);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
      setIsListening(false);
    }
  };

  // Change language
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);

    if (clientRef.current && isConnected) {
      clientRef.current.setLanguage(newLanguage);
      addLog('CONFIG', 'Idioma cambiado', newLanguage);
    }
  };

  // Change LLM provider
  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setSelectedProvider(newProvider);

    if (clientRef.current && isConnected) {
      clientRef.current.setLLMProvider(newProvider);
      addLog('CONFIG', 'Modelo LLM cambiado', newProvider);
    }
  };

  // Reset conversation
  const handleReset = () => {
    if (clientRef.current && isConnected) {
      clientRef.current.reset();
      setTranscription('');
      setResponse('');
      addLog('EVENTO', 'Conversación reiniciada');
    }
  };

  // Enable audio playback
  const handleEnablePlayback = () => {
    if (clientRef.current) {
      clientRef.current.enableAudioPlayback();
      addLog('AUDIO', 'Reproducción de audio activada');
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      handleConnect();
    }

    return () => {
      if (clientRef.current && isConnected) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // Status indicator
  const getStatusText = () => {
    if (isListening) return '🔴 Escuchando...';
    if (isProcessing) return '⚙️ Procesando...';
    if (isConnected) return '🟢 Conectado';
    return '⚪ Desconectado';
  };

  const getStatusColor = () => {
    if (isListening) return '#ff6b6b';
    if (isConnected) return '#51cf66';
    return '#868e96';
  };

  return (
    <div className="realtime-voice-widget">
      <style>{`
        .realtime-voice-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }

        .widget-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f0f0f0;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .widget-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .widget-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .widget-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .widget-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #d32f2f;
        }

        .widget-config {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .config-group {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        .config-group:last-child {
          margin-bottom: 0;
        }

        .config-label {
          min-width: 80px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #666;
        }

        .config-select {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
        }

        .widget-output {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .output-section {
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
        }

        .output-section:last-child {
          border-bottom: none;
        }

        .output-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #667eea;
          margin-bottom: 5px;
        }

        .output-content {
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          word-break: break-word;
          min-height: 20px;
        }

        .output-empty {
          color: #999;
          font-style: italic;
        }

        .widget-logs {
          background: #1e1e1e;
          color: #0f0;
          border-radius: 6px;
          padding: 12px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.6;
          max-height: 200px;
          overflow-y: auto;
        }

        .log-entry {
          padding: 3px 0;
        }
      `}</style>

      {/* Header */}
      <div className="widget-header">
        <div className="widget-title">
          🎤 Realtime Voice
        </div>
        <div className="status-badge" style={{ color: getStatusColor() }}>
          {getStatusText()}
        </div>
      </div>

      {/* Controls */}
      <div className="widget-controls">
        <button
          className="widget-btn btn-primary"
          onClick={handleConnect}
          disabled={isConnected}
        >
          Conectar
        </button>
        <button
          className="widget-btn btn-primary"
          onClick={handleStartListening}
          disabled={!isConnected || isListening}
        >
          Escuchar
        </button>
        <button
          className="widget-btn btn-secondary"
          onClick={handleStopListening}
          disabled={!isListening}
        >
          Detener
        </button>
        <button
          className="widget-btn btn-secondary"
          onClick={handleReset}
          disabled={!isConnected}
        >
          Reiniciar
        </button>
        <button
          className="widget-btn btn-secondary"
          onClick={handleEnablePlayback}
          disabled={!isConnected}
        >
          Audio
        </button>
        <button
          className="widget-btn btn-danger"
          onClick={handleDisconnect}
          disabled={!isConnected}
        >
          Desconectar
        </button>
      </div>

      {/* Configuration */}
      <div className="widget-config">
        <div className="config-group">
          <label className="config-label">Idioma:</label>
          <select
            className="config-select"
            value={selectedLanguage}
            onChange={handleLanguageChange}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <div className="config-group">
          <label className="config-label">Modelo IA:</label>
          <select
            className="config-select"
            value={selectedProvider}
            onChange={handleProviderChange}
          >
            <option value="gemini">Gemini (Rápido)</option>
            <option value="claude">Claude (Calidad)</option>
            <option value="openai">OpenAI (GPT-4o-mini)</option>
          </select>
        </div>
      </div>

      {/* Output */}
      <div className="widget-output">
        {transcription && (
          <div className="output-section">
            <div className="output-label">Transcripción</div>
            <div className="output-content">{transcription}</div>
          </div>
        )}

        {response && (
          <div className="output-section">
            <div className="output-label">Respuesta</div>
            <div className="output-content">{response}</div>
          </div>
        )}

        {!transcription && !response && (
          <div className="output-section">
            <div className="output-content output-empty">
              Conecta e inicia a escuchar para comenzar
            </div>
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="widget-logs">
        {logs.length === 0 ? (
          <div className="log-entry">> Esperando eventos...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="log-entry">
              {'> ' + log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RealtimeVoiceWidget;
