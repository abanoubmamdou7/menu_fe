import React, { useState } from 'react';
import { 
  useAllQuestions, 
  useCreateQuestion, 
  useUpdateQuestion, 
  useDeleteQuestion, 
  useToggleQuestionStatus,
  SurveyQuestion,
  SurveyQuestionFormValues
} from '@/services/surveyService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const questionTypeIcons = {
  rating: Star,
  text: MessageSquare,
  yes_no: ThumbsUp,
};

const questionTypeLabels = {
  rating: 'Rating (1-10)',
  text: 'Text Response',
  yes_no: 'Yes / No',
};

const AdminSurveyQuestions: React.FC = () => {
  const { data: questions = [], isLoading } = useAllQuestions();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const toggleStatus = useToggleQuestionStatus();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [formData, setFormData] = useState<SurveyQuestionFormValues>({
    question_en: '',
    question_ar: '',
    question_type: 'rating',
    is_active: true,
    display_order: 0,
  });

  const isPending = createQuestion.isPending || updateQuestion.isPending;

  const handleOpenDialog = (question?: SurveyQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question_en: question.question_en,
        question_ar: question.question_ar,
        question_type: question.question_type as 'rating' | 'text' | 'yes_no',
        is_active: question.is_active,
        display_order: question.display_order,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        question_en: '',
        question_ar: '',
        question_type: 'rating',
        is_active: true,
        display_order: questions.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, values: formData });
        toast.success('Question updated successfully');
      } else {
        await createQuestion.mutateAsync(formData);
        toast.success('Question created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(`Failed to ${editingQuestion ? 'update' : 'create'} question`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question? All associated responses will also be deleted.')) {
      try {
        await deleteQuestion.mutateAsync(id);
        toast.success('Question deleted successfully');
      } catch {
        toast.error('Failed to delete question');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync({ id, is_active: !currentStatus });
      toast.success(`Question ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle question status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Questions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your survey questions with bilingual support (English & Arabic)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {/* Questions Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-24 text-center">Active</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-5 w-10" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No questions yet. Click "Add Question" to create your first survey question.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question, index) => {
                const TypeIcon = questionTypeIcons[question.question_type as keyof typeof questionTypeIcons] || Star;
                return (
                  <TableRow 
                    key={question.id}
                    className={cn(
                      "transition-colors",
                      !question.is_active && "bg-gray-50 opacity-60"
                    )}
                  >
                    <TableCell className="font-medium text-gray-500">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-gray-300" />
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{question.question_en}</p>
                        <p className="text-sm text-gray-500" dir="rtl">{question.question_ar}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {questionTypeLabels[question.question_type as keyof typeof questionTypeLabels]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={question.is_active}
                        onCheckedChange={() => handleToggleStatus(question.id, question.is_active)}
                        disabled={toggleStatus.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(question)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(question.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? 'Update your survey question in both languages.' 
                : 'Create a new survey question with English and Arabic translations.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* English Question */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Question (English) <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.question_en}
                  onChange={e => setFormData(prev => ({ ...prev, question_en: e.target.value }))}
                  placeholder="Enter the question in English..."
                  required
                  className="min-h-[100px]"
                />
              </div>

              {/* Arabic Question */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Question (Arabic) <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.question_ar}
                  onChange={e => setFormData(prev => ({ ...prev, question_ar: e.target.value }))}
                  placeholder="أدخل السؤال بالعربية..."
                  required
                  dir="rtl"
                  className="min-h-[100px] text-right"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Question Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Question Type</label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value: 'rating' | 'text' | 'yes_no') => 
                    setFormData(prev => ({ ...prev, question_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Rating (1-10)
                      </div>
                    </SelectItem>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Text Response
                      </div>
                    </SelectItem>
                    <SelectItem value="yes_no">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Yes / No
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Display Order</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="flex h-10 items-center gap-3 rounded-md border bg-gray-50 px-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    formData.is_active ? "text-emerald-600" : "text-gray-500"
                  )}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSurveyQuestions;

