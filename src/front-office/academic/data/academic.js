export const initialAcademicClasses = [
  { id: "acls-1", name: "Nursery", status: "Active" },
  { id: "acls-2", name: "LKG", status: "Active" },
  { id: "acls-3", name: "Class I", status: "Active" },
  { id: "acls-4", name: "Class II", status: "Active" },
  { id: "acls-5", name: "Class III", status: "Inactive" },
];

export const initialSections = [
  { id: "sec-1", name: "A", status: "Active" },
  { id: "sec-2", name: "B", status: "Active" },
  { id: "sec-3", name: "C", status: "Active" },
  { id: "sec-4", name: "D", status: "Inactive" },
];

export const ROOM_TYPES = [
  "Classroom",
  "Science Lab",
  "Computer Lab",
  "Library",
  "Activity Room",
];

export const initialClassrooms = [
  { id: "room-1", roomNo: "101", roomType: "Classroom", capacity: 40, status: "Available" },
  { id: "room-2", roomNo: "102", roomType: "Classroom", capacity: 40, status: "Available" },
  { id: "room-3", roomNo: "103", roomType: "Classroom", capacity: 45, status: "Occupied" },
  { id: "room-4", roomNo: "104", roomType: "Classroom", capacity: 40, status: "Available" },
  { id: "room-5", roomNo: "105", roomType: "Computer Lab", capacity: 35, status: "Available" },
  { id: "room-6", roomNo: "201", roomType: "Science Lab", capacity: 50, status: "Available" },
  { id: "room-7", roomNo: "202", roomType: "Science Lab", capacity: 50, status: "Occupied" },
  { id: "room-8", roomNo: "203", roomType: "Computer Lab", capacity: 40, status: "Available" },
  { id: "room-9", roomNo: "204", roomType: "Classroom", capacity: 42, status: "Available" },
  { id: "room-10", roomNo: "301", roomType: "Library", capacity: 40, status: "Maintenance" },
];

export const initialTeachers = [
  { id: "tch-1", name: "Priya Sharma" },
  { id: "tch-2", name: "Amit Patel" },
  { id: "tch-3", name: "Riya Sharma" },
  { id: "tch-4", name: "Neha Gupta" },
  { id: "tch-5", name: "Rahul Mehta" },
  { id: "tch-6", name: "Ananya Iyer" },
];

export const SUBJECT_TYPES = ["Theory", "Practical"];

export const initialSubjects = [
  { id: "sub-1", name: "English", type: "Theory", status: "Active" },
  { id: "sub-2", name: "Math", type: "Theory", status: "Active" },
  { id: "sub-3", name: "Physics", type: "Practical", status: "Active" },
  { id: "sub-4", name: "Chemistry", type: "Practical", status: "Active" },
  { id: "sub-5", name: "Biology", type: "Practical", status: "Active" },
  { id: "sub-6", name: "History", type: "Theory", status: "Active" },
  { id: "sub-7", name: "Geography", type: "Theory", status: "Active" },
  { id: "sub-8", name: "Computer", type: "Practical", status: "Active" },
  { id: "sub-9", name: "Hindi", type: "Theory", status: "Inactive" },
  { id: "sub-10", name: "Economics", type: "Theory", status: "Active" },
  { id: "sub-11", name: "Science", type: "Practical", status: "Active" },
];

/** Which subjects are taught in which class. */
export const initialClassSubjects = [
  { id: "cs-1", classId: "acls-1", subjectId: "sub-1" },
  { id: "cs-2", classId: "acls-1", subjectId: "sub-2" },
  { id: "cs-3", classId: "acls-1", subjectId: "sub-9" },
  { id: "cs-4", classId: "acls-3", subjectId: "sub-1" },
  { id: "cs-5", classId: "acls-3", subjectId: "sub-2" },
  { id: "cs-6", classId: "acls-3", subjectId: "sub-6" },
  { id: "cs-7", classId: "acls-3", subjectId: "sub-7" },
  { id: "cs-8", classId: "acls-3", subjectId: "sub-8" },
  { id: "cs-15", classId: "acls-3", subjectId: "sub-11" },
  { id: "cs-9", classId: "acls-4", subjectId: "sub-1" },
  { id: "cs-10", classId: "acls-4", subjectId: "sub-2" },
  { id: "cs-11", classId: "acls-4", subjectId: "sub-3" },
  { id: "cs-12", classId: "acls-4", subjectId: "sub-4" },
  { id: "cs-13", classId: "acls-4", subjectId: "sub-5" },
  { id: "cs-14", classId: "acls-4", subjectId: "sub-8" },
];

/** Class–section mappings with optional room, teacher, and occupancy. */
export const initialMappings = [
  {
    id: "map-1",
    classId: "acls-3",
    sectionId: "sec-1",
    roomId: "room-1",
    teacherId: "tch-1",
    enrolled: 38,
  },
  {
    id: "map-2",
    classId: "acls-3",
    sectionId: "sec-2",
    roomId: "room-2",
    teacherId: "tch-2",
    enrolled: 42,
  },
  {
    id: "map-3",
    classId: "acls-4",
    sectionId: "sec-1",
    roomId: "room-3",
    teacherId: "tch-3",
    enrolled: 30,
  },
  {
    id: "map-4",
    classId: "acls-4",
    sectionId: "sec-2",
    roomId: "",
    teacherId: "",
    enrolled: null,
  },
];

export function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const ACADEMIC_YEARS = ["2025-2026", "2026-2027", "2027-2028"];

export const CALENDAR_COLORS = [
  { id: "blue", bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  { id: "green", bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  { id: "purple", bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" },
  { id: "yellow", bg: "#fef9c3", text: "#854d0e", border: "#fef08a" },
  { id: "red", bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  { id: "orange", bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
  { id: "teal", bg: "#ccfbf1", text: "#0f766e", border: "#99f6e4" },
  { id: "pink", bg: "#fce7f3", text: "#be185d", border: "#fbcfe8" },
  { id: "indigo", bg: "#e0e7ff", text: "#4338ca", border: "#c7d2fe" },
  { id: "cyan", bg: "#cffafe", text: "#0e7490", border: "#a5f3fc" },
  { id: "gray", bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" },
];

export const EVENT_CATEGORIES = [
  "Exam",
  "Holiday",
  "Meeting",
  "Activity",
  "Notice",
  "Other",
];

/** Default demo events for AY 2026-2027 */
export const initialCalendarEvents = [
  {
    id: "cev-1",
    title: "Half-Yearly Exams",
    start: "2026-06-10",
    end: "2026-06-18",
    cat: "Exam",
    color: "blue",
    desc: "Mid-term exams for all classes",
  },
  {
    id: "cev-2",
    title: "Summer Vacation",
    start: "2026-06-20",
    end: "2026-07-15",
    cat: "Holiday",
    color: "green",
    desc: "Annual summer break",
  },
  {
    id: "cev-3",
    title: "Parent-Teacher Meeting",
    start: "2026-08-05",
    end: "2026-08-05",
    cat: "Meeting",
    color: "purple",
    desc: "Term 1 progress discussion",
  },
  {
    id: "cev-4",
    title: "Annual Sports Day",
    start: "2026-11-12",
    end: "2026-11-14",
    cat: "Activity",
    color: "yellow",
    desc: "Sports competitions and closing ceremony",
  },
];

export const ROUTINE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const ROUTINE_COLORS = ["math", "sci", "eng", "hist", "comp"];

/** Demo weekly slots for Class I – Section A */
export const initialRoutineSlots = [
  // Monday
  { id: "rt-1", classId: "acls-3", sectionId: "sec-1", day: "Monday", type: "lecture", subject: "Math", teacher: "Priya Sharma", start: "08:00", end: "08:40", room: "Room 101 · Classroom", color: "math" },
  { id: "rt-2", classId: "acls-3", sectionId: "sec-1", day: "Monday", type: "lecture", subject: "Science", teacher: "Amit Patel", start: "08:40", end: "09:20", room: "Room 201 · Science Lab", color: "sci" },
  { id: "rt-3", classId: "acls-3", sectionId: "sec-1", day: "Monday", type: "lecture", subject: "English", teacher: "Riya Sharma", start: "09:20", end: "10:00", room: "Room 101 · Classroom", color: "eng" },
  { id: "rt-5", classId: "acls-3", sectionId: "sec-1", day: "Monday", type: "lecture", subject: "History", teacher: "Neha Gupta", start: "12:20", end: "13:00", room: "Room 101 · Classroom", color: "hist" },
  // Tuesday
  { id: "rt-6", classId: "acls-3", sectionId: "sec-1", day: "Tuesday", type: "lecture", subject: "English", teacher: "Riya Sharma", start: "08:00", end: "08:40", room: "Room 101 · Classroom", color: "eng" },
  { id: "rt-7", classId: "acls-3", sectionId: "sec-1", day: "Tuesday", type: "lecture", subject: "Math", teacher: "Priya Sharma", start: "08:40", end: "09:20", room: "Room 101 · Classroom", color: "math" },
  { id: "rt-8", classId: "acls-3", sectionId: "sec-1", day: "Tuesday", type: "lecture", subject: "Computer", teacher: "Rahul Mehta", start: "09:20", end: "10:00", room: "Room 105 · Computer Lab", color: "comp" },
  { id: "rt-9", classId: "acls-3", sectionId: "sec-1", day: "Tuesday", type: "lecture", subject: "Science", teacher: "Amit Patel", start: "12:20", end: "13:00", room: "Room 201 · Science Lab", color: "sci" },
  // Wednesday
  { id: "rt-10", classId: "acls-3", sectionId: "sec-1", day: "Wednesday", type: "lecture", subject: "History", teacher: "Neha Gupta", start: "08:00", end: "08:40", room: "Room 101 · Classroom", color: "hist" },
  { id: "rt-11", classId: "acls-3", sectionId: "sec-1", day: "Wednesday", type: "lecture", subject: "Computer", teacher: "Rahul Mehta", start: "08:40", end: "09:20", room: "Room 105 · Computer Lab", color: "comp" },
  { id: "rt-12", classId: "acls-3", sectionId: "sec-1", day: "Wednesday", type: "lecture", subject: "Math", teacher: "Priya Sharma", start: "09:20", end: "10:00", room: "Room 101 · Classroom", color: "math" },
  { id: "rt-13", classId: "acls-3", sectionId: "sec-1", day: "Wednesday", type: "lecture", subject: "English", teacher: "Riya Sharma", start: "12:20", end: "13:00", room: "Room 101 · Classroom", color: "eng" },
  // Thursday
  { id: "rt-14", classId: "acls-3", sectionId: "sec-1", day: "Thursday", type: "lecture", subject: "Science", teacher: "Amit Patel", start: "08:00", end: "08:40", room: "Room 201 · Science Lab", color: "sci" },
  { id: "rt-15", classId: "acls-3", sectionId: "sec-1", day: "Thursday", type: "lecture", subject: "English", teacher: "Riya Sharma", start: "08:40", end: "09:20", room: "Room 101 · Classroom", color: "eng" },
  { id: "rt-16", classId: "acls-3", sectionId: "sec-1", day: "Thursday", type: "lecture", subject: "History", teacher: "Neha Gupta", start: "09:20", end: "10:00", room: "Room 101 · Classroom", color: "hist" },
  { id: "rt-17", classId: "acls-3", sectionId: "sec-1", day: "Thursday", type: "lecture", subject: "Computer", teacher: "Rahul Mehta", start: "12:20", end: "13:00", room: "Room 105 · Computer Lab", color: "comp" },
  // Friday
  { id: "rt-18", classId: "acls-3", sectionId: "sec-1", day: "Friday", type: "lecture", subject: "Math", teacher: "Priya Sharma", start: "08:00", end: "08:40", room: "Room 101 · Classroom", color: "math" },
  { id: "rt-19", classId: "acls-3", sectionId: "sec-1", day: "Friday", type: "lecture", subject: "Computer", teacher: "Rahul Mehta", start: "08:40", end: "09:20", room: "Room 105 · Computer Lab", color: "comp" },
  { id: "rt-20", classId: "acls-3", sectionId: "sec-1", day: "Friday", type: "lecture", subject: "Science", teacher: "Amit Patel", start: "09:20", end: "10:00", room: "Room 201 · Science Lab", color: "sci" },
  { id: "rt-21", classId: "acls-3", sectionId: "sec-1", day: "Friday", type: "lecture", subject: "History", teacher: "Neha Gupta", start: "12:20", end: "13:00", room: "Room 101 · Classroom", color: "hist" },
  // Saturday
  { id: "rt-22", classId: "acls-3", sectionId: "sec-1", day: "Saturday", type: "lecture", subject: "English", teacher: "Riya Sharma", start: "08:00", end: "08:40", room: "Room 101 · Classroom", color: "eng" },
  { id: "rt-23", classId: "acls-3", sectionId: "sec-1", day: "Saturday", type: "lecture", subject: "Math", teacher: "Priya Sharma", start: "08:40", end: "09:20", room: "Room 101 · Classroom", color: "math" },
  { id: "rt-24", classId: "acls-3", sectionId: "sec-1", day: "Saturday", type: "lecture", subject: "Science", teacher: "Amit Patel", start: "09:20", end: "10:00", room: "Room 201 · Science Lab", color: "sci" },
];
