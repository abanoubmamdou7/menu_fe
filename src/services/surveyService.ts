import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface SurveyQuestion {
  id: string;
  question_en: string;
  question_ar: string;
  question_type: 'rating' | 'text' | 'yes_no';
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  question_id: string;
  rating: number | null;
  text_response: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  session_id: string;
  created_at: string;
  question?: SurveyQuestion;
}

export interface SurveyQuestionFormValues {
  question_en: string;
  question_ar: string;
  question_type: 'rating' | 'text' | 'yes_no';
  is_active: boolean;
  display_order: number;
}

export interface SurveySubmission {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  responses: {
    question_id: string;
    rating?: number;
    text_response?: string;
  }[];
}

// Fetch active questions (for public survey)
export const fetchActiveQuestions = async (): Promise<SurveyQuestion[]> => {
  const { data, error } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data as SurveyQuestion[]) || [];
};

// Fetch all questions (for admin)
export const fetchAllQuestions = async (): Promise<SurveyQuestion[]> => {
  const { data, error } = await supabase
    .from('survey_questions')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data as SurveyQuestion[]) || [];
};

// Create question
export const createQuestion = async (values: SurveyQuestionFormValues): Promise<SurveyQuestion> => {
  const { data, error } = await supabase
    .from('survey_questions')
    .insert([values])
    .select()
    .single();

  if (error) throw error;
  return data as SurveyQuestion;
};

// Update question
export const updateQuestion = async (id: string, values: Partial<SurveyQuestionFormValues>): Promise<SurveyQuestion> => {
  const { data, error } = await supabase
    .from('survey_questions')
    .update(values)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SurveyQuestion;
};

// Delete question
export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('survey_questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Toggle question active status
export const toggleQuestionStatus = async (id: string, is_active: boolean): Promise<SurveyQuestion> => {
  return updateQuestion(id, { is_active });
};

// Submit survey responses
export const submitSurvey = async (submission: SurveySubmission): Promise<void> => {
  const session_id = crypto.randomUUID();
  
  const responses = submission.responses.map(response => ({
    question_id: response.question_id,
    rating: response.rating ?? null,
    text_response: response.text_response ?? null,
    customer_name: submission.customer_name ?? null,
    customer_email: submission.customer_email ?? null,
    customer_phone: submission.customer_phone ?? null,
    session_id,
  }));

  const { error } = await supabase
    .from('survey_responses')
    .insert(responses);

  if (error) throw error;
};

// Fetch all responses with questions (for admin)
export const fetchAllResponses = async (): Promise<SurveyResponse[]> => {
  const { data, error } = await supabase
    .from('survey_responses')
    .select(`
      *,
      question:survey_questions(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as SurveyResponse[]) || [];
};

// Fetch responses grouped by session
export interface GroupedSurveyResponse {
  session_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  responses: SurveyResponse[];
}

export const fetchGroupedResponses = async (): Promise<GroupedSurveyResponse[]> => {
  const responses = await fetchAllResponses();
  
  const grouped = responses.reduce((acc, response) => {
    if (!acc[response.session_id]) {
      acc[response.session_id] = {
        session_id: response.session_id,
        customer_name: response.customer_name,
        customer_email: response.customer_email,
        customer_phone: response.customer_phone,
        created_at: response.created_at,
        responses: [],
      };
    }
    acc[response.session_id].responses.push(response);
    return acc;
  }, {} as Record<string, GroupedSurveyResponse>);

  return Object.values(grouped).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// Delete a response session
export const deleteResponseSession = async (session_id: string): Promise<void> => {
  const { error } = await supabase
    .from('survey_responses')
    .delete()
    .eq('session_id', session_id);

  if (error) throw error;
};

// React Query Hooks

export const useActiveQuestions = () => {
  return useQuery({
    queryKey: ['surveyQuestions', 'active'],
    queryFn: fetchActiveQuestions,
  });
};

export const useAllQuestions = () => {
  return useQuery({
    queryKey: ['surveyQuestions', 'all'],
    queryFn: fetchAllQuestions,
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<SurveyQuestionFormValues> }) =>
      updateQuestion(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] });
    },
  });
};

export const useToggleQuestionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleQuestionStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] });
    },
  });
};

export const useSubmitSurvey = () => {
  return useMutation({
    mutationFn: submitSurvey,
  });
};

export const useGroupedResponses = () => {
  return useQuery({
    queryKey: ['surveyResponses', 'grouped'],
    queryFn: fetchGroupedResponses,
  });
};

export const useDeleteResponseSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResponseSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyResponses'] });
    },
  });
};

