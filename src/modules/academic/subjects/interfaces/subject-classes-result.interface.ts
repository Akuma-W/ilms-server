export interface SubjectClassItem {
  id: string;
  title: string;
  subject: string;
  courseCode: string | null;
  semester: string | null;
  isPrivate: boolean;
  totalStudents: number;
  maxStudents: number | null;
  createdAt: Date | null;
  teacher: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}
