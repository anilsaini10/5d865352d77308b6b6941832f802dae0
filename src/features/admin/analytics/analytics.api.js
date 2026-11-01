import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

const base = '/admin/analytics'
const get = (path, q) => httpClient.get(`${base}/${path}`, { params: params(q ?? {}) }).then(unwrap)

export const analyticsApi = {
  overview(q) { return get('overview', q) },

  studentStrength(q) { return get('student-strength', q) },
  enrollmentTrend(q) { return get('enrollment-trend', q) },
  genderDistribution(q) { return get('gender-distribution', q) },
  gradeDistribution(q) { return get('grade-distribution', q) },
  studentGrowth(q) { return get('student-growth', q) },

  studentAttendance(q) { return get('student-attendance', q) },
  attendanceTrend(q) { return get('attendance-trend', q) },
  lowAttendanceStudents(q) { return get('low-attendance-students', q).then(normalizePage) },
  repeatedAbsences(q) { return get('repeated-absences', q).then(normalizePage) },
  teacherAttendance(q) { return get('teacher-attendance', q) },
  schoolCalendar(q) { return get('school-calendar', q) },

  academicPerformance(q) { return get('academic-performance', q) },
  passFail(q) { return get('pass-fail', q) },
  subjectPerformance(q) { return get('subject-performance', q) },
  classPerformance(q) { return get('class-performance', q) },
  examPerformance(q) { return get('exam-performance', q) },
  topPerformers(q) { return get('top-performers', q) },
  needsSupport(q) { return get('needs-support', q).then(normalizePage) },
  academicGrowth(q) { return get('academic-growth', q) },

  teacherPerformance(q) { return get('teacher-performance', q) },
  teacherDetail(teacherId, q) { return get(`teacher-performance/${teacherId}`, q) },
  teacherGrowth(q) { return get('teacher-growth', q) },
  teacherWorkload(q) { return get('teacher-workload', q) },
  teacherHomework(q) { return get('teacher-homework', q) },
  teacherWeeklyTests(q) { return get('teacher-weekly-tests', q) },
  teacherSyllabusProgress(q) { return get('teacher-syllabus-progress', q) },

  homework(q) { return get('homework', q) },
  homeworkSubmissions(q) { return get('homework-submissions', q) },
  assignmentCompletion(q) { return get('assignment-completion', q) },
  projectPractical(q) { return get('project-practical', q) },
  weeklyTests(q) { return get('weekly-tests', q) },
  weeklyTestPerformance(q) { return get('weekly-test-performance', q) },

  yearComparison(q) { return get('year-comparison', q) },
  termComparison(q) { return get('term-comparison', q) },
  monthlyTrends(q) { return get('monthly-trends', q) },
  classComparison(q) { return get('class-comparison', q) },
  subjectComparison(q) { return get('subject-comparison', q) },
  studentEngagement(q) { return get('student-engagement', q) },
  coCurricular(q) { return get('co-curricular', q) },
  studentParticipation(q) { return get('student-participation', q) },

  alerts(q) { return get('alerts', q) },
  riskSummary(q) { return get('risk-summary', q) },
}
