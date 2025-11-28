-- Create lectures table
CREATE TABLE public.lectures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  professor_name TEXT NOT NULL,
  location TEXT NOT NULL,
  lecture_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  additional_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Create policies for lectures
CREATE POLICY "Users can view their own lectures"
ON public.lectures
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lectures"
ON public.lectures
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lectures"
ON public.lectures
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lectures"
ON public.lectures
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lectures_updated_at
BEFORE UPDATE ON public.lectures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add lecture_id to notifications table
ALTER TABLE public.notifications
ADD COLUMN lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;