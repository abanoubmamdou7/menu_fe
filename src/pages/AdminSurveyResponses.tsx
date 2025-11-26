import React, { useState, useMemo } from 'react';
import { useGroupedResponses, useDeleteResponseSession, GroupedSurveyResponse } from '@/services/surveyService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Eye, Search, Calendar, User, Mail, Phone, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminSurveyResponses: React.FC = () => {
  const { data: responses = [], isLoading } = useGroupedResponses();
  const deleteSession = useDeleteResponseSession();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<GroupedSurveyResponse | null>(null);

  const filteredResponses = useMemo(() => {
    if (!searchTerm.trim()) return responses;
    const term = searchTerm.toLowerCase();
    return responses.filter(r => 
      r.customer_name?.toLowerCase().includes(term) ||
      r.customer_email?.toLowerCase().includes(term) ||
      r.customer_phone?.includes(term)
    );
  }, [responses, searchTerm]);

  const handleDelete = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this survey response?')) {
      try {
        await deleteSession.mutateAsync(sessionId);
        toast.success('Response deleted successfully');
        setSelectedResponse(null);
      } catch {
        toast.error('Failed to delete response');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getAverageRating = (response: GroupedSurveyResponse) => {
    const ratingResponses = response.responses.filter(r => r.rating !== null);
    if (ratingResponses.length === 0) return null;
    const avg = ratingResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingResponses.length;
    return avg.toFixed(1);
  };

  const renderRating = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">—</span>;
    const getColor = (r: number) => {
      if (r >= 8) return "bg-emerald-500";
      if (r >= 5) return "bg-amber-500";
      return "bg-rose-500";
    };
    return (
      <div className="flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white", getColor(rating))}>
          {rating}
        </div>
        <span className="text-xs text-gray-500">/10</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Responses</h2>
          <p className="mt-1 text-sm text-gray-600">
            View and manage customer survey submissions ({responses.length} total)
          </p>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Responses Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-32 text-center">Avg Rating</TableHead>
              <TableHead className="w-40">Submitted</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredResponses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  {searchTerm ? 'No responses match your search.' : 'No survey responses yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredResponses.map(response => {
                const avgRating = getAverageRating(response);
                return (
                  <TableRow key={response.session_id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          {response.customer_name || 'Anonymous'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {response.customer_email && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="h-3.5 w-3.5" />
                            {response.customer_email}
                          </div>
                        )}
                        {response.customer_phone && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="h-3.5 w-3.5" />
                            {response.customer_phone}
                          </div>
                        )}
                        {!response.customer_email && !response.customer_phone && (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {avgRating ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-amber-500">{avgRating}</span>
                            <span className="text-xs text-gray-400">/10</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {response.responses.filter(r => r.rating).length} ratings
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(response.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedResponse(response)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(response.session_id)}
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

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Survey Response Details
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedResponse && formatDate(selectedResponse.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedResponse && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="rounded-lg border bg-gray-50/50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-700">Customer Information</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{selectedResponse.customer_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedResponse.customer_email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedResponse.customer_phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">Answers</h4>
                {selectedResponse.responses.map((response, index) => (
                  <div
                    key={response.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-gray-50/50"
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {response.question?.question_en || 'Unknown question'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500" dir="rtl">
                          {response.question?.question_ar || ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-8">
                      {response.question?.question_type === 'rating' && (
                        <div className="flex items-center gap-3">
                          {renderRating(response.rating)}
                        </div>
                      )}
                      
                      {response.question?.question_type === 'yes_no' && (
                        <div className="flex items-center gap-2">
                          {response.rating === 10 ? (
                            <>
                              <ThumbsUp className="h-5 w-5 text-emerald-500" />
                              <span className="font-medium text-emerald-600">Yes</span>
                            </>
                          ) : response.rating === 1 ? (
                            <>
                              <ThumbsDown className="h-5 w-5 text-rose-500" />
                              <span className="font-medium text-rose-600">No</span>
                            </>
                          ) : (
                            <span className="text-gray-400">Not answered</span>
                          )}
                        </div>
                      )}
                      
                      {response.question?.question_type === 'text' && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <p className="text-gray-700">
                            {response.text_response || <span className="text-gray-400 italic">No response</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedResponse.session_id)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Response
                </Button>
                <Button variant="outline" onClick={() => setSelectedResponse(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSurveyResponses;

