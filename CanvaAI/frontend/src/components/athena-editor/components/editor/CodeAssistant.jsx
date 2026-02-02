import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { 
  Code2,
  BookOpen,
  RefreshCw,
  MessageSquare,
  Play,
  Bug,
  FileCode2
} from 'lucide-react';

export const CodeAssistant = ({ 
  open, 
  onOpenChange, 
  onAction, 
  selectedCode = "" 
}) => {
  const [actionType, setActionType] = useState('');
  const [code, setCode] = useState(selectedCode);
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);

  const actions = [
    { value: 'generate', label: 'Generate Code', icon: Code2 },
    { value: 'explain', label: 'Explain Code', icon: BookOpen },
    { value: 'refactor', label: 'Refactor Code', icon: RefreshCw },
    { value: 'add_comments', label: 'Add Comments', icon: MessageSquare },
  ];

  const languages = [
    "javascript", "python", "java", "c", "cpp", "csharp", "php", "ruby",
    "go", "swift", "kotlin", "typescript", "html", "css", "sql", "bash",
    "rust", "scala", "r", "dart", "lua", "perl", "haskell", "elixir"
  ];

  const handleSubmit = async () => {
    if (!actionType) {
      toast.error('Please select an action type');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter some code to process');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let result = code;
      
      // In a real implementation, this would call the AI service
      switch(actionType) {
        case 'generate':
          result = `// Generated ${language} code\nconsole.log("Hello, World!");`;
          break;
        case 'explain':
          result = `// Explanation of the code:\n// This code snippet demonstrates a basic example in ${language}`;
          break;
        case 'refactor':
          result = `// Refactored version of the code\n${code}\n// Optimized for better performance`;
          break;
        case 'add_comments':
          result = `// Added comments to the code\n${code}\n// End of code`;
          break;
        default:
          result = code;
      }

      if (onAction) {
        onAction(actionType, result, language);
      }
      
      toast.success(`${actionType.replace('_', ' ')} completed successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to ${actionType.replace('_', ' ')} code`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-green-600" />
            Code Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="language">Programming Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Code to Process</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Enter your code here..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !actionType || !code.trim()}>
            {loading ? 'Processing...' : 'Apply Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeAssistant;