import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { 
  Edit3, 
  Plus, 
  FileText, 
  Type, 
  SpellCheck, 
  List,
  BookOpen,
  Zap
} from 'lucide-react';

export const AIInlineActions = ({ 
  open, 
  onOpenChange, 
  onAction, 
  selectedText = "" 
}) => {
  const [actionType, setActionType] = useState('');
  const [inputText, setInputText] = useState(selectedText);
  const [loading, setLoading] = useState(false);

  const actions = [
    { value: 'rewrite', label: 'Rewrite', icon: Edit3 },
    { value: 'expand', label: 'Expand', icon: Plus },
    { value: 'summarize', label: 'Summarize', icon: FileText },
    { value: 'change_tone', label: 'Change Tone', icon: Type },
    { value: 'fix_grammar', label: 'Fix Grammar', icon: SpellCheck },
    { value: 'bullets_to_paragraph', label: 'Bullets to Paragraph', icon: List },
  ];

  const tones = [
    "Professional", "Casual", "Academic", "Creative", "Technical",
    "Formal", "Friendly", "Persuasive", "Informative", "Narrative"
  ];

  const handleSubmit = async () => {
    if (!actionType) {
      toast.error('Please select an action type');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let result = inputText;
      
      // In a real implementation, this would call the AI service
      switch(actionType) {
        case 'rewrite':
          result = `Rewritten version of: ${inputText.substring(0, 50)}...`;
          break;
        case 'expand':
          result = `Expanded version of: ${inputText}. This is additional content to make it longer.`;
          break;
        case 'summarize':
          result = `Summary of: ${inputText.substring(0, 30)}...`;
          break;
        case 'change_tone':
          result = `Content with different tone: ${inputText}`;
          break;
        case 'fix_grammar':
          result = `Grammar corrected: ${inputText}`;
          break;
        case 'bullets_to_paragraph':
          result = `Converted bullets to paragraph: ${inputText}`;
          break;
        default:
          result = inputText;
      }

      if (onAction) {
        onAction(actionType, result);
      }
      
      toast.success(`${actionType.replace('_', ' ')} completed successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to ${actionType.replace('_', ' ')} text`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            AI Inline Actions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="actionType">Select Action</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an action..." />
              </SelectTrigger>
              <SelectContent>
                {actions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <SelectItem key={action.value} value={action.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {action.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inputText">Text to Process</Label>
            <Textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter or paste the text you want to process..."
              rows={4}
            />
          </div>
          
          {actionType === 'change_tone' && (
            <div className="space-y-2">
              <Label htmlFor="tone">Select Tone</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tone..." />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone} value={tone.toLowerCase()}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !actionType}>
            {loading ? 'Processing...' : 'Apply Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIInlineActions;