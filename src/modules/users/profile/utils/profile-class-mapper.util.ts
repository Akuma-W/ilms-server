import { ProfileClassEntity } from '../entities/profile-class.entity';

interface EnrollmentWithClass {
  id: string;
  status: string;
  roleIn: string;
  joinedAt: Date | null;
  class: {
    id: string;
    courseCode: string | null;
    title: string;
    description: string | null;
    subject: string | null;
    semester: string | null;
    createdAt: Date | null;
    teacher: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    } | null;
    _count: {
      enrollments: number;
      topics: number;
      assignments: number;
      quizPublications: number;
    };
  };
}

interface TeacherClassWithCounts {
  id: string;
  courseCode: string | null;
  title: string;
  description: string | null;
  subject: string | null;
  semester: string | null;
  createdAt: Date | null;
  teacher: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  _count: {
    enrollments: number;
    topics: number;
    assignments: number;
    quizPublications: number;
  };
}

// Maps student approved enrollments into profile class view entities
export function mapStudentEnrollmentsToProfileClasses(
  enrollments: EnrollmentWithClass[],
): ProfileClassEntity[] {
  return enrollments.map((e) => ({
    id: e.class.id,
    courseCode: e.class.courseCode,
    title: e.class.title,
    description: e.class.description,
    subject: e.class.subject,
    semester: e.class.semester,
    totalStudents: e.class._count.enrollments,
    totalTopics: e.class._count.topics,
    totalAssignments: e.class._count.assignments,
    totalQuizzes: e.class._count.quizPublications,
    createdAt: e.class.createdAt,
    teacher: e.class.teacher,
    enrollment: {
      id: e.id,
      status: e.status,
      role: e.roleIn,
      joinedAt: e.joinedAt,
    },
  }));
}

// Maps teacher classes into profile class view entities
export function mapTeacherClassesToProfileClasses(
  classes: TeacherClassWithCounts[],
): ProfileClassEntity[] {
  return classes.map((c) => ({
    id: c.id,
    courseCode: c.courseCode,
    title: c.title,
    description: c.description,
    subject: c.subject,
    semester: c.semester,
    totalStudents: c._count.enrollments,
    totalTopics: c._count.topics,
    totalAssignments: c._count.assignments,
    totalQuizzes: c._count.quizPublications,
    createdAt: c.createdAt,
    teacher: c.teacher,
    enrollment: null,
  }));
}
