import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronRight, ChevronLeft, GraduationCap, Users, ClipboardList,
  Bell, BarChart3, Shield, Calendar, BookOpen, Loader2, MapPin, School,
  ArrowRight, CheckCircle2, Smartphone, Globe, Star,
} from 'lucide-react'
import { publicApi } from '../../api/publicApi.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'

import brandLogo from '../../assets/images/logo_title_transparent.png'
import heroImg1 from '../../assets/static/classroom-teaching.webp'
import heroImg2 from '../../assets/static/school-campus.webp'
import heroImg3 from '../../assets/static/morning-prayer-assembly.webp'
import heroImg4 from '../../assets/static/indian-school-flag.webp'
import heroImg5 from '../../assets/static/classroom-learning.webp'
import heroImg6 from '../../assets/static/school-assembly-students.webp'
import heroImg7 from '../../assets/static/sports-playground.webp'
import heroImg8 from '../../assets/static/morning-school-assembly.webp'
import heroImg9 from '../../assets/static/paper-to-digital.webp'
import aboutImg1 from '../../assets/static/flag-assembly.webp'
import aboutImg2 from '../../assets/static/library-group-study.webp'
import aboutImg3 from '../../assets/static/science-lab.webp'
import aboutImg4 from '../../assets/static/science-laboratory.webp'
import aboutImg5 from '../../assets/static/school-library.webp'
import aboutImg6 from '../../assets/static/students-playing-football.webp'
import aboutImg7 from '../../assets/static/student-art-activity.webp'
import aboutImg8 from '../../assets/static/school-achievement-trophy.webp'

const HERO_IMAGES = [heroImg1, heroImg2, heroImg3, heroImg4, heroImg5, heroImg6, heroImg7, heroImg8, heroImg9]

const FEATURES = [
  { icon: ClipboardList, title: 'Smart Attendance', desc: 'Digital attendance marking with instant parent notifications — no manual registers.' },
  { icon: GraduationCap, title: 'Exam & Results', desc: 'Create exams, enter marks, auto-generate report cards parents can access anytime.' },
  { icon: Calendar, title: 'Timetable & Calendar', desc: 'Drag-and-drop timetable builder with academic calendar synced to the entire school.' },
  { icon: Users, title: 'Student & Teacher Management', desc: 'Complete profiles, bulk uploads, promotions, and academic history in one place.' },
  { icon: Bell, title: 'Announcements & Notifications', desc: 'Push updates to parents, teachers, and staff — no WhatsApp groups needed.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Actionable dashboards on attendance trends, academic performance, and more.' },
  { icon: BookOpen, title: 'Syllabus Tracking', desc: 'Track chapter-wise progress, set targets, and flag delays before they become problems.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Give every staff member exactly the access they need — not a bit more, not a bit less.' },
]

const BENEFITS = {
  school: [
    'Go paperless — attendance, fees, and records all digital',
    'Real-time dashboards for the principal and management',
    'Manage multiple academic sessions and class promotions',
    'Role-based access keeps data safe and organised',
  ],
  teacher: [
    'Mark attendance in seconds from any device',
    'Upload marks and homework — parents see it instantly',
    'Track syllabus completion with smart reminders',
    'Get leave requests and announcements directly',
  ],
  parent: [
    'Live attendance alerts when your child reaches school',
    'View exam results, homework, and report cards on the app',
    'Pay fees online — no queues, no cash, no confusion',
    'Stay connected with teachers through direct notifications',
  ],
}

function Navbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-paper/95 backdrop-blur-md shadow-card border-b border-line' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2">
          <div className="overflow-hidden" style={{ width: '10rem', height: '2.9rem' }}>
            <img src={brandLogo} alt="Nought One" className="max-w-none" style={{ width: '12.5rem', marginLeft: '-1.5rem', marginTop: '-2.65rem' }} />
          </div>
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70">
          <a href="#features" className="hover:text-board transition-colors">Features</a>
          <a href="#schools" className="hover:text-board transition-colors">Schools</a>
          <a href="#about" className="hover:text-board transition-colors">About</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-board hover:text-board-light transition-colors px-4 py-2"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-sm font-semibold bg-board hover:bg-board-light text-paper rounded-lg px-5 py-2.5 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  )
}

function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef(null)

  const startAutoPlay = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 4000)
  }

  useEffect(() => {
    startAutoPlay()
    return () => clearInterval(intervalRef.current)
  }, [])

  const go = (dir) => {
    setCurrent((prev) => (prev + dir + HERO_IMAGES.length) % HERO_IMAGES.length)
    startAutoPlay()
  }

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden shadow-pop group">
      {HERO_IMAGES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
        <ChevronLeft size={20} className="text-ink" />
      </button>
      <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
        <ChevronRight size={20} className="text-ink" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button key={i} onClick={() => { setCurrent(i); startAutoPlay() }} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}

function ImageScroller() {
  const scrollRef = useRef(null)
  const allImages = [heroImg1, heroImg2, heroImg3, heroImg4, heroImg5, heroImg6, heroImg7, heroImg8, heroImg9, aboutImg1, aboutImg2, aboutImg3, aboutImg4, aboutImg5, aboutImg6, aboutImg7, aboutImg8]

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative group">
      <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-pop opacity-0 group-hover:opacity-100 transition-opacity -ml-3">
        <ChevronLeft size={20} className="text-ink" />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allImages.map((src, i) => (
          <img key={i} src={src} alt="" className="w-72 h-48 object-cover rounded-xl flex-shrink-0 shadow-card hover:shadow-pop transition-shadow" />
        ))}
      </div>
      <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-pop opacity-0 group-hover:opacity-100 transition-opacity -mr-3">
        <ChevronRight size={20} className="text-ink" />
      </button>
    </div>
  )
}

function SchoolCard({ school, onClick }) {
  return (
    <button onClick={onClick} className="text-left bg-surface border border-line rounded-xl p-5 hover:shadow-pop hover:border-board/20 transition-all group">
      <div className="flex items-start gap-4">
        {school.logoUrl ? (
          <img src={school.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-line flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-board/8 flex items-center justify-center flex-shrink-0">
            <School size={22} className="text-board" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink group-hover:text-board transition-colors truncate">{school.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-ink/55">
            <MapPin size={13} />
            <span className="truncate">{school.city}{school.state ? `, ${school.state}` : ''}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {school.board && <span className="text-xs font-semibold bg-board/8 text-board px-2 py-0.5 rounded-full">{school.board}</span>}
        {school.medium && <span className="text-xs font-medium bg-chalk/15 text-chalk-ink px-2 py-0.5 rounded-full">{school.medium}</span>}
        {school.totalStudents > 0 && <span className="text-xs text-ink/50">{school.totalStudents} students</span>}
      </div>
    </button>
  )
}

function SchoolDetailModal({ school, onClose }) {
  const [detail, setDetail] = useState(null)
  const [teachers, setTeachers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('info')

  useEffect(() => {
    if (!school) return
    setLoading(true)
    Promise.all([
      publicApi.getSchool(school.id),
      publicApi.getSchoolTeachers(school.id, { limit: 10 }),
    ])
      .then(([d, t]) => { setDetail(d); setTeachers(t) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [school])

  if (!school) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-paper rounded-2xl shadow-pop w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-paper border-b border-line px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-ink">{school.name}</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink p-1">✕</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-board" /></div>
        ) : detail ? (
          <div className="p-6">
            <div className="flex gap-2 mb-6 border-b border-line">
              {['info', 'teachers'].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? 'border-board text-board' : 'border-transparent text-ink/50 hover:text-ink'}`}>{t}</button>
              ))}
            </div>

            {tab === 'info' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow label="Board" value={detail.board} />
                  <InfoRow label="Medium" value={detail.medium} />
                  <InfoRow label="Type" value={detail.schoolType?.replace('_', '-')} />
                  <InfoRow label="Established" value={detail.establishedYear} />
                  <InfoRow label="Classes" value={detail.academics ? `${detail.academics.classesFrom} to ${detail.academics.classesTo}` : '—'} />
                  <InfoRow label="Principal" value={detail.leadership?.principalName} />
                </div>
                {detail.address && (
                  <div className="bg-surface border border-line rounded-lg p-4">
                    <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-1">Address</p>
                    <p className="text-sm text-ink">{[detail.address.addressLine1, detail.address.addressLine2, detail.address.city, detail.address.state, detail.address.pincode].filter(Boolean).join(', ')}</p>
                  </div>
                )}
                {detail.strength && (
                  <div className="grid grid-cols-3 gap-3">
                    <StatBox label="Students" value={detail.strength.totalStudents} />
                    <StatBox label="Teachers" value={detail.strength.totalTeachers} />
                    <StatBox label="Staff" value={detail.strength.totalStaff} />
                  </div>
                )}
                {detail.contact && (
                  <div className="bg-surface border border-line rounded-lg p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">Contact</p>
                    {detail.contact.email && <p className="text-sm text-ink">{detail.contact.email}</p>}
                    {detail.contact.phone && <p className="text-sm text-ink">{detail.contact.phone}</p>}
                    {detail.contact.website && <a href={detail.contact.website} target="_blank" rel="noopener noreferrer" className="text-sm text-board hover:underline">{detail.contact.website}</a>}
                  </div>
                )}
              </div>
            )}

            {tab === 'teachers' && (
              <div className="space-y-3">
                {teachers?.teachers?.length > 0 ? teachers.teachers.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 bg-surface border border-line rounded-lg p-4">
                    {t.profilePhoto ? (
                      <img src={t.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-board/10 flex items-center justify-center text-board font-semibold text-sm">{t.name?.[0]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink">{t.name}</p>
                      <p className="text-xs text-ink/50">{t.qualification} · {t.experienceYears}y exp</p>
                    </div>
                    {t.subjectsTaught?.length > 0 && (
                      <div className="flex flex-wrap gap-1">{t.subjectsTaught.map((s) => <span key={s} className="text-xs bg-board/8 text-board px-2 py-0.5 rounded-full">{s}</span>)}</div>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-ink/50 text-center py-8">No teachers listed publicly for this school.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink/50 text-center py-16">Could not load school details.</p>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-ink mt-0.5">{value || '—'}</p>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-board/5 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-board">{value ?? 0}</p>
      <p className="text-xs text-ink/50 mt-0.5">{label}</p>
    </div>
  )
}

function SchoolsDirectory() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [board, setBoard] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, board])

  useEffect(() => {
    setLoading(true)
    publicApi.listSchools({ search: debouncedSearch || undefined, board: board || undefined, page, limit: 12 })
      .then((data) => {
        setSchools(data?.schools ?? [])
        setPagination(data?.pagination ?? null)
      })
      .catch(() => setSchools([]))
      .finally(() => setLoading(false))
  }, [debouncedSearch, board, page])

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools by name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-board/20 focus:border-board"
          />
        </div>
        <select value={board} onChange={(e) => setBoard(e.target.value)} className="text-sm bg-surface border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-board/20">
          <option value="">All Boards</option>
          <option value="CBSE">CBSE</option>
          <option value="ICSE">ICSE</option>
          <option value="STATE_BOARD">State Board</option>
          <option value="IB">IB</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-board" /></div>
      ) : schools.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((s) => <SchoolCard key={s.id} school={s} onClick={() => setSelectedSchool(s)} />)}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-sm font-semibold text-board disabled:opacity-40 hover:underline">Previous</button>
              <span className="text-sm text-ink/50">Page {page} of {pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="text-sm font-semibold text-board disabled:opacity-40 hover:underline">Next</button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-ink/50 py-16 text-sm">No schools found. Try a different search or filter.</p>
      )}

      {selectedSchool && <SchoolDetailModal school={selectedSchool} onClose={() => setSelectedSchool(null)} />}
    </>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-board/8 text-board text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star size={13} />
              Trusted by schools across India
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-ink">
              Your school, <br />
              <span className="text-board">completely digital.</span>
            </h1>
            <p className="mt-5 text-lg text-ink/60 max-w-lg">
              From attendance to report cards, fees to timetables — one platform that brings your entire school online. Built for Indian schools.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => navigate('/signup')} className="flex items-center gap-2 bg-board hover:bg-board-light text-paper font-semibold text-sm rounded-lg px-6 py-3 transition-colors">
                Get Started <ArrowRight size={16} />
              </button>
              <a href="#schools" className="flex items-center gap-2 border border-line hover:border-board/30 text-ink font-semibold text-sm rounded-lg px-6 py-3 transition-colors">
                Explore Schools
              </a>
            </div>

            <div className="flex gap-8 mt-10 pt-8 border-t border-line">
              <div>
                <p className="text-2xl font-bold text-board">100%</p>
                <p className="text-xs text-ink/50 mt-0.5">Paperless</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-board">3x</p>
                <p className="text-xs text-ink/50 mt-0.5">Faster Admin</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-board">24/7</p>
                <p className="text-xs text-ink/50 mt-0.5">Parent Access</p>
              </div>
            </div>
          </div>

          <HeroCarousel />
        </div>
      </section>

      {/* Image scroller */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ImageScroller />
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Everything your school needs</h2>
          <p className="mt-3 text-ink/55 max-w-xl mx-auto">One platform to manage academics, administration, and communication — no more juggling five different tools.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-xl p-5 hover:shadow-card hover:border-board/15 transition-all">
              <div className="w-10 h-10 rounded-lg bg-board/8 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-board" />
              </div>
              <h3 className="font-semibold text-ink text-sm">{f.title}</h3>
              <p className="text-xs text-ink/55 mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it helps — School / Teacher / Parent */}
      <section className="py-20 bg-board/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">How we make schools digital</h2>
            <p className="mt-3 text-ink/55 max-w-xl mx-auto">Our SaaS platform helps every stakeholder — from the principal's desk to a parent's phone.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(BENEFITS).map(([key, points]) => {
              const icons = { school: School, teacher: GraduationCap, parent: Smartphone }
              const titles = { school: 'For Schools', teacher: 'For Teachers', parent: 'For Parents' }
              const Icon = icons[key]
              return (
                <div key={key} className="bg-surface border border-line rounded-2xl p-6 hover:shadow-card transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-board/8 flex items-center justify-center mb-5">
                    <Icon size={24} className="text-board" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink mb-4">{titles[key]}</h3>
                  <ul className="space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex gap-2.5 text-sm text-ink/70">
                        <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Schools Directory */}
      <section id="schools" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">School Directory</h2>
          <p className="mt-3 text-ink/55">Browse and discover schools across India using our platform.</p>
        </div>
        <SchoolsDirectory />
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-board text-on-board">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold">About Our Mission</h2>
              <p className="mt-5 text-on-board/70 leading-relaxed">
                We believe every school — whether a 200-student school in a small town or a 3,000-student campus in a metro — deserves the tools to run efficiently, communicate clearly, and focus on what matters most: education.
              </p>
              <p className="mt-4 text-on-board/70 leading-relaxed">
                Our platform was built by people who understand Indian schools. We know the chaos of admission season, the pressure of exam week, and the relief when a parent gets a simple SMS that their child reached safely. We've turned those moments into software.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <div className="flex items-center gap-2 bg-on-board/10 rounded-lg px-4 py-2.5">
                  <Globe size={18} />
                  <span className="text-sm font-semibold">Cloud-based SaaS</span>
                </div>
                <div className="flex items-center gap-2 bg-on-board/10 rounded-lg px-4 py-2.5">
                  <Smartphone size={18} />
                  <span className="text-sm font-semibold">Mobile apps for parents</span>
                </div>
                <div className="flex items-center gap-2 bg-on-board/10 rounded-lg px-4 py-2.5">
                  <Shield size={18} />
                  <span className="text-sm font-semibold">Secure & reliable</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <img src={aboutImg1} alt="Flag assembly" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg2} alt="Library study" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg3} alt="Science lab" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg4} alt="Science laboratory" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg5} alt="School library" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg6} alt="Students playing football" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg7} alt="Student art activity" className="rounded-xl object-cover h-40 w-full" />
              <img src={aboutImg8} alt="School achievement trophy" className="rounded-xl object-cover h-40 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-board-dark text-on-board/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="overflow-hidden" style={{ width: '10rem', height: '2.9rem' }}>
            <img src={brandLogo} alt="Nought One" className="max-w-none" style={{ width: '12.5rem', marginLeft: '-1.5rem', marginTop: '-2.65rem' }} />
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Nought One. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
