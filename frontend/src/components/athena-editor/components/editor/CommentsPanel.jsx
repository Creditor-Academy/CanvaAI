import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Check, CheckCheck, Reply,
    MoreVertical, Trash2, Edit3, AtSign, Flag, Plus,
    User, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { cn } from '../utils';

const COMMENT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
];

const CommentsPanel = ({ isOpen, onClose, editor }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [suggestionMode, setSuggestionMode] = useState(false);
    const textareaRef = useRef(null);

    const currentUser = { name: 'You', color: COMMENT_COLORS[0], initials: 'YO' };

    const addComment = () => {
        if (!newComment.trim()) return;
        const selectedText = editor
            ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')
            : '';

        const comment = {
            id: Date.now(),
            text: newComment,
            author: currentUser,
            timestamp: new Date(),
            resolved: false,
            replies: [],
            selectedText,
            assignedTo: null,
            isSuggestion: suggestionMode,
        };
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        toast.success('Comment added');
    };

    const addReply = (commentId) => {
        if (!replyText.trim()) return;
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c, replies: [...c.replies, {
                        id: Date.now(),
                        text: replyText,
                        author: currentUser,
                        timestamp: new Date(),
                    }]
                };
            }
            return c;
        }));
        setReplyText('');
        setReplyingTo(null);
        toast.success('Reply added');
    };

    const resolveComment = (id) => {
        setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
        toast.success('Comment status updated');
    };

    const deleteComment = (id) => {
        setComments(prev => prev.filter(c => c.id !== id));
        toast.success('Comment deleted');
    };

    const startEdit = (comment) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const saveEdit = (id) => {
        setComments(prev => prev.map(c => c.id === id ? { ...c, text: editText } : c));
        setEditingId(null);
        toast.success('Comment updated');
    };

    const acceptSuggestion = (comment) => {
        if (editor && comment.selectedText) {
            toast.success('Suggestion accepted');
        }
        resolveComment(comment.id);
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const unresolvedCount = comments.filter(c => !c.resolved).length;

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            className="fixed right-0 top-0 h-full w-80 bg-white border-l border-blue-100 shadow-2xl z-40 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">Comments</span>
                    {unresolvedCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unresolvedCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setSuggestionMode(!suggestionMode)}
                        title="Suggestion Mode"
                        className={cn(
                            "text-xs px-2 py-1 rounded-md font-medium transition-colors",
                            suggestionMode ? "bg-green-100 text-green-700 border border-green-300" : "text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        {suggestionMode ? '✏️ Suggest' : 'Suggest'}
                    </button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* New Comment Input */}
            <div className="p-3 border-b border-blue-50">
                <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                        YO
                    </div>
                    <div className="flex-1">
                        <Textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={suggestionMode ? "Add a suggestion..." : "Add a comment... (@mention someone)"}
                            className="text-sm resize-none border-blue-200 focus:border-blue-400 rounded-xl min-h-[60px]"
                            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') addComment(); }}
                        />
                        <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[10px] text-gray-400">Ctrl+Enter to submit</span>
                            <Button
                                size="sm"
                                onClick={addComment}
                                disabled={!newComment.trim()}
                                className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                <Send className="w-3 h-3 mr-1" />
                                {suggestionMode ? 'Suggest' : 'Comment'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 text-gray-400">
                        <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No comments yet</p>
                        <p className="text-xs mt-1">Select text and add a comment</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {comments.map(comment => (
                            <div
                                key={comment.id}
                                className={cn(
                                    "p-3 transition-colors",
                                    comment.resolved ? "bg-gray-50 opacity-60" : "bg-white hover:bg-blue-50/30",
                                    comment.isSuggestion && "border-l-2 border-green-400"
                                )}
                            >
                                {/* Comment header */}
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                            style={{ backgroundColor: comment.author.color }}
                                        >
                                            {comment.author.initials}
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-gray-800">{comment.author.name}</span>
                                            <span className="text-[10px] text-gray-400 ml-1">{formatTime(comment.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {comment.isSuggestion && (
                                            <button
                                                onClick={() => acceptSuggestion(comment)}
                                                className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded hover:bg-green-200"
                                            >✓ Accept</button>
                                        )}
                                        <button
                                            onClick={() => resolveComment(comment.id)}
                                            title={comment.resolved ? "Reopen" : "Resolve"}
                                            className={cn(
                                                "p-1 rounded hover:bg-gray-100",
                                                comment.resolved ? "text-green-500" : "text-gray-400"
                                            )}
                                        >
                                            {comment.resolved ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                        </button>
                                        <button onClick={() => startEdit(comment)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                            <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => deleteComment(comment.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Selected text reference */}
                                {comment.selectedText && (
                                    <div className="text-[10px] text-gray-400 bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 mb-1.5 rounded italic truncate">
                                        "{comment.selectedText}"
                                    </div>
                                )}

                                {/* Comment text */}
                                {editingId === comment.id ? (
                                    <div>
                                        <Textarea
                                            value={editText}
                                            onChange={e => setEditText(e.target.value)}
                                            className="text-xs resize-none min-h-[50px] mb-1"
                                        />
                                        <div className="flex gap-1">
                                            <Button size="sm" className="h-6 text-xs" onClick={() => saveEdit(comment.id)}>Save</Button>
                                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-700 leading-relaxed">{comment.text}</p>
                                )}

                                {/* Replies */}
                                {comment.replies.length > 0 && (
                                    <div className="mt-2 pl-3 border-l border-gray-200 space-y-2">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id}>
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <div
                                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                                                        style={{ backgroundColor: reply.author.color }}
                                                    >
                                                        {reply.author.initials}
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-gray-700">{reply.author.name}</span>
                                                    <span className="text-[9px] text-gray-400">{formatTime(reply.timestamp)}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-600">{reply.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply input */}
                                {replyingTo === comment.id ? (
                                    <div className="mt-2 flex gap-1">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Reply..."
                                            className="flex-1 text-xs border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
                                            onKeyDown={e => { if (e.key === 'Enter') addReply(comment.id); if (e.key === 'Escape') setReplyingTo(null); }}
                                        />
                                        <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => addReply(comment.id)}>↵</Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700"
                                    >
                                        <Reply className="w-3 h-3" /> Reply
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer stats */}
            {comments.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex justify-between text-[10px] text-gray-400">
                    <span>{comments.filter(c => !c.resolved).length} open</span>
                    <span>{comments.filter(c => c.resolved).length} resolved</span>
                    <button
                        onClick={() => setComments(prev => prev.filter(c => !c.resolved))}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        Clear resolved
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export { CommentsPanel };
