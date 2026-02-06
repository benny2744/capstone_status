
import React, { useState, useMemo, useEffect } from 'react';
import StudentTable from './components/StudentTable';
import LoginPage from './components/LoginPage';

// Check if we're in development mode (Vite dev server)
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? 'http://localhost:5001' : '';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = known
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch students when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/status`, { credentials: 'include' });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      setUser(data.user || null);
    } catch (err) {
      // If API not available (dev mode without backend), use local data
      if (isDev) {
        setIsAuthenticated(true);
        setUser('dev');
        // Load local data for development
        import('./data/students.json').then(module => {
          setStudentsData(module.default);
          setLoading(false);
        });
      } else {
        setIsAuthenticated(false);
      }
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/students`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStudentsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (err) {
      setLoginError('Connection error. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) { }
    setIsAuthenticated(false);
    setUser(null);
    setStudentsData([]);
  };

  // Extract unique classes for filter
  const classes = useMemo(() => {
    const cls = new Set(studentsData.map(s => s.className).filter(Boolean));
    return ['All', ...Array.from(cls)];
  }, [studentsData]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.chineseName.includes(searchTerm) ||
        student.tutorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = selectedClass === 'All' || student.className === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [studentsData, searchTerm, selectedClass]);

  // Calculations for stats
  const averageGpa = useMemo(() => {
    const validGpas = filteredStudents
      .map(s => parseFloat(s.gpa))
      .filter(g => !isNaN(g));
    if (validGpas.length === 0) return 0;
    return (validGpas.reduce((a, b) => a + b, 0) / validGpas.length).toFixed(2);
  }, [filteredStudents]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      {/* Decorative Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] rounded-full bg-brand-200 blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-200 blur-3xl opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 space-y-8">

        {/* Header Section */}
        <header className="pt-12 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-bold uppercase tracking-wider">Class 2027</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Capstone Cycle 26-27</span>
              </div>
              <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight">
                Student <span className="text-brand-600">Growth</span> Profiles
              </h1>
              <p className="text-slate-500 mt-2 text-lg max-w-xl leading-relaxed">
                Comprehensive academic and personal growth data for project planning and facilitation.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 items-start">
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm flex flex-col items-center min-w-[100px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students</span>
                <span className="text-2xl font-display font-bold text-slate-800">{filteredStudents.length}</span>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm flex flex-col items-center min-w-[100px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg GPA</span>
                <span className="text-2xl font-display font-bold text-brand-600">{averageGpa}</span>
              </div>
              {/* User & Logout */}
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{user}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sticky Filter Bar */}
        <div className="sticky top-6 z-20">
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-soft border border-white/50 ring-1 ring-slate-900/5 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search student name, tutor..."
                className="block w-full pl-10 pr-3 py-3 rounded-xl bg-transparent border-transparent focus:bg-white focus:border-brand-500 focus:ring-0 sm:text-sm text-slate-900 placeholder-slate-400 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48 border-t md:border-t-0 md:border-l border-slate-200 pl-0 md:pl-2">
              <div className="relative">
                <select
                  className="block w-full pl-4 pr-10 py-3 text-base border-transparent bg-transparent focus:ring-0 focus:border-transparent sm:text-sm rounded-xl font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors appearance-none"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {selectedStudent.photo ? (
                    <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-brand-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      {selectedStudent.chineseName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.chineseName}</h2>
                    <p className="text-slate-500">{selectedStudent.name.replace(selectedStudent.chineseName, '').trim()}</p>
                    {selectedStudent.futureDirection && (
                      <span className="inline-block mt-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">
                        {selectedStudent.futureDirection}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="ml-auto p-2 rounded-lg hover:bg-slate-100">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Student Details */}
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-medium">Class:</span> {selectedStudent.className}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-medium">Tutor:</span> {selectedStudent.tutorName}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-600">GPA:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${parseFloat(selectedStudent.gpa) >= 4.0 ? 'bg-emerald-100 text-emerald-700' :
                        parseFloat(selectedStudent.gpa) >= 3.0 ? 'bg-blue-100 text-blue-700' :
                          parseFloat(selectedStudent.gpa) >= 2.0 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                        }`}>
                        {typeof selectedStudent.gpa === 'number' ? selectedStudent.gpa.toFixed(2) : selectedStudent.gpa}
                      </span>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudent.strengths?.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Areas for Growth</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudent.weaknesses?.map((w, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">{w}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Activities</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudent.activities?.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">{a}</span>
                      ))}
                    </div>
                  </div>

                  {/* Growth Portrait */}
                  {selectedStudent.growthPortrait && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {selectedStudent.growthPortrait.goals && selectedStudent.growthPortrait.goals !== "Not available" && (
                        <div>
                          <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">Goals</h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedStudent.growthPortrait.goals}</p>
                        </div>
                      )}
                      {selectedStudent.growthPortrait.selfReflection && selectedStudent.growthPortrait.selfReflection !== "Not available" && (
                        <details className="group">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 text-purple-500 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <div>
                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Self Reflection</h4>
                                <p className="text-sm text-slate-600">
                                  {selectedStudent.growthPortrait.selfReflectionSummary || selectedStudent.growthPortrait.selfReflection.substring(0, 100) + '...'}
                                </p>
                              </div>
                            </div>
                          </summary>
                          <div className="pl-6 mt-2">
                            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-purple-50/50 rounded-lg p-3 border-l-2 border-purple-200">{selectedStudent.growthPortrait.selfReflection}</p>
                          </div>
                        </details>
                      )}
                      {selectedStudent.growthPortrait.tutorComment && (
                        <details className="group">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 text-emerald-500 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <div>
                                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Tutor's View</h4>
                                <p className="text-sm text-slate-600">
                                  {selectedStudent.growthPortrait.tutorCommentSummary || selectedStudent.growthPortrait.tutorComment.substring(0, 100) + '...'}
                                </p>
                              </div>
                            </div>
                          </summary>
                          <div className="pl-6 mt-2">
                            <p className="text-sm text-slate-600 whitespace-pre-wrap italic bg-emerald-50/50 rounded-lg p-3 border-l-2 border-emerald-200">{selectedStudent.growthPortrait.tutorComment}</p>
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 overflow-hidden">
          {filteredStudents.length > 0 ? (
            <StudentTable students={filteredStudents} onSelectStudent={setSelectedStudent} />
          ) : (
            <div className="text-center py-24">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">No students found</h3>
              <p className="mt-1 text-slate-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
