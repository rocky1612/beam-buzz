import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LectureFormProps {
  onSubmit: (data: {
    title: string;
    subject: string;
    professor_name: string;
    location: string;
    lecture_time: string;
    day_of_week: number;
    additional_notes?: string;
    is_active: boolean;
  }) => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const LectureForm = ({ onSubmit, isLoading }: LectureFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    professor_name: "",
    location: "",
    lecture_time: "",
    day_of_week: 1,
    additional_notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, is_active: true });
    setFormData({
      title: "",
      subject: "",
      professor_name: "",
      location: "",
      lecture_time: "",
      day_of_week: 1,
      additional_notes: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Lecture</CardTitle>
        <CardDescription>Schedule a new lecture and receive morning notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Lecture Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Advanced Mathematics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Calculus II"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professor">Professor Name</Label>
              <Input
                id="professor"
                value={formData.professor_name}
                onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
                placeholder="Dr. Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Room 301, Building A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.lecture_time}
                onChange={(e) => setFormData({ ...formData, lecture_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              placeholder="Bring calculator, Chapter 5 quiz today..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            Add Lecture
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
