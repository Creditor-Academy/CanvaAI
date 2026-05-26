import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Settings2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const VOICE_COMMANDS = {
    'new paragraph': () => ({ type: 'paragraph' }),
    'new line': () => ({ type: 'newline' }),
    'period': () => ({ type: 'punctuation', value: '.' }),
    'comma': () => ({ type: 'punctuation', value: ',' }),
    'question mark': () => ({ type: 'punctuation', value: '?' }),
    'exclamation mark': () => ({ type: 'punctuation', value: '!' }),
    'bold': () => ({ type: 'format', action: 'bold' }),
    'italic': () => ({ type: 'format', action: 'italic' }),
    'underline': () => ({ type: 'format', action: 'underline' }),
    'stop listening': () => ({ type: 'stop' }),
};

const VoiceTyping = ({ isOpen, onClose, editor }) => {
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('en-US');
    const recognitionRef = useRef(null);
    // Fix: Use ref for isListening flag to avoid stale closure in onend handler
    const isListeningRef = useRef(false);

    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    const processCommand = useCallback((text) => {
        const lowerText = text.toLowerCase().trim();
        for (const [command, handler] of Object.entries(VOICE_COMMANDS)) {
            if (lowerText.includes(command)) {
                const action = handler();
                if (!editor) return false;
                switch (action.type) {
                    case 'paragraph': editor.chain().focus().splitBlock().run(); return true;
                    case 'newline': editor.chain().focus().insertContent('<br/>').run(); return true;
                    case 'punctuation': editor.chain().focus().insertContent(action.value).run(); return true;
                    case 'format':
                        if (action.action === 'bold') editor.chain().focus(null, { scrollIntoView: false }).toggleBold().run();
                        if (action.action === 'italic') editor.chain().focus(null, { scrollIntoView: false }).toggleItalic().run();
                        if (action.action === 'underline') editor.chain().focus(null, { scrollIntoView: false }).toggleUnderline().run();
                        return true;
                    case 'stop': stopListening(); return true;
                }
            }
        }
        return false;
    }, [editor]);

    const startListening = useCallback(() => {
        if (!isSupported) {
            toast.error('Voice typing is not supported in this browser');
            return;
        }
        setError(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }
            if (isMounted.current) {
                setInterimTranscript(interim);
            }
            if (final) {
                const isCommand = processCommand(final);
                if (!isCommand && editor) {
                    editor.chain().focus().insertContent(final).run();
                    if (isMounted.current) {
                        setTranscript(prev => prev + final);
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return;
            if (isMounted.current) {
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            }
            isListeningRef.current = false;
        };

        // Fix: Use ref instead of state to avoid stale closure
        recognition.onend = () => {
            if (isListeningRef.current && isMounted.current) {
                recognition.start();
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        if (isMounted.current) {
            setIsListening(true);
        }
        isListeningRef.current = true;
        toast.success('Voice typing started. Speak now!');
    }, [isSupported, language, editor, processCommand]);

    const stopListening = useCallback(() => {
        // CRITICAL FIX: Set ref to false BEFORE stopping to prevent onend from restarting
        // This ensures the closure in onend always sees the current value
        isListeningRef.current = false;
        setIsListening(false);
        
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        
        setInterimTranscript('');
        toast.info('Voice typing stopped');
    }, []);

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    useEffect(() => {
        // Cleanup on unmount - prevent infinite loops
        return () => {
            isListeningRef.current = false;  // Set ref false first to block onend restart
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen && isListening) stopListening();
    }, [isOpen, isListening, stopListening]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden"
            style={{ zIndex: 600 }} // Layer 6: Special Floating Panels
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">Voice Typing</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { stopListening(); onClose(); }}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-4 space-y-4">
                {/* Language selector */}
                <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    disabled={isListening}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="ar-SA">Arabic (RTL)</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                    <option value="ja-JP">Japanese</option>
                </select>

                {/* Mic button */}
                <div className="flex flex-col items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleListening}
                        disabled={!isSupported}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isListening
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isListening ? (
                            <MicOff className="w-6 h-6" />
                        ) : (
                            <Mic className="w-6 h-6" />
                        )}
                    </motion.button>
                    {isListening && (
                        <motion.div
                            className="flex gap-1 items-end h-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-red-400 rounded-full"
                                    animate={{ height: [4, 16 + Math.random() * 8, 4] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                />
                            ))}
                        </motion.div>
                    )}
                    <p className="text-xs text-gray-500">
                        {!isSupported ? 'Not supported in this browser'
                            : isListening ? 'Listening... speak now'
                                : 'Click to start voice typing'}
                    </p>
                </div>

                {/* Error display */}
                {error && (
                    <div className="text-xs text-red-500 bg-red-50 px-2 py-1.5 rounded-lg">{error}</div>
                )}

                {/* Interim transcript */}
                {interimTranscript && (
                    <div className="text-xs text-gray-400 italic bg-gray-50 px-2 py-1.5 rounded-lg min-h-[30px]">
                        {interimTranscript}
                    </div>
                )}

                {/* Final transcript history */}
                {transcript && (
                    <div className="border-t border-gray-100 pt-2">
                        <p className="text-[10px] text-gray-400 mb-1 font-medium">Transcript:</p>
                        <div className="text-xs text-gray-600 max-h-20 overflow-y-auto bg-gray-50 p-2 rounded-lg">
                            {transcript}
                        </div>
                        <button
                            onClick={() => setTranscript('')}
                            className="text-[10px] text-blue-500 mt-1 hover:text-blue-700"
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Voice commands reference */}
                <div className="border-t border-gray-100 pt-2">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Voice Commands:</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {Object.keys(VOICE_COMMANDS).slice(0, 8).map(cmd => (
                            <span key={cmd} className="text-[10px] text-gray-500">• "{cmd}"</span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export { VoiceTyping };
