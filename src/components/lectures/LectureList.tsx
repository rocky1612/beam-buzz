import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Trash2 } from "lucide-react";
import { Lecture } from "@/hooks/useLectures";

interface LectureListProps {
  lectures: Lecture[];
  onDelete: (id: string) => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const LectureList = ({ lectures, onDelete }: LectureListProps) => {
  if (lectures.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No lectures scheduled yet. Add your first lecture above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lectures.map((lecture) => (
        <Card key={lecture.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{lecture.title}</CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {lecture.subject}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(lecture.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{DAYS[lecture.day_of_week]} at {lecture.lecture_time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{lecture.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{lecture.professor_name}</span>
            </div>
            {lecture.additional_notes && (
              <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                📝 {lecture.additional_notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
