import { Project, TeamMember, Task } from './types.ts';

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Akshaya M. (Lead / MC)',
    role: 'Event Director & MC Host',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#3B82F6', // Blue
    dailyCapacityHours: 6,
    skills: ['MC Hosting', 'Stage Direction', 'Event Ops', 'Scriptwriting'],
    isOnline: true,
  },
  {
    id: 'user-2',
    name: 'Devon Vance',
    role: 'Full-Stack & Cloud Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#10B981', // Emerald
    dailyCapacityHours: 8,
    skills: ['Node.js', 'PostgreSQL', 'Express', 'WebSockets', 'Cloud Run'],
    isOnline: true,
  },
  {
    id: 'user-3',
    name: 'Priya Sharma',
    role: 'AI / NLP Specialist',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    color: '#8B5CF6', // Purple
    dailyCapacityHours: 7,
    skills: ['Gemini API', 'Sentiment Analysis', 'Speech-to-Text', 'NLP Prompter'],
    isOnline: true,
  },
  {
    id: 'user-4',
    name: 'Marcus Chen',
    role: 'Frontend & QR Experience Dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#F59E0B', // Amber
    dailyCapacityHours: 8,
    skills: ['React', 'Tailwind CSS', 'QR Scanning', 'PWA', 'Mobile UX'],
    isOnline: false,
  },
  {
    id: 'user-5',
    name: 'Sarah Lin',
    role: 'Volunteer Coordinator & Logistics',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: '#EC4899', // Pink
    dailyCapacityHours: 6,
    skills: ['Attendance Verification', 'Floor Ops', 'Stage Coordination'],
    isOnline: true,
  }
];

export const INITIAL_PROJECT: Project = {
  id: 'proj-campusconnect',
  title: 'CampusConnect: Smart College Event & MC Platform',
  description: 'Unifying event operations, QR attendee tracking, AI-assisted MC stage hosting & voice-cue teleprompter, and live sentiment analysis.',
  startDate: '2026-09-10',
  targetDeadline: '2026-10-15',
  categories: [
    'Event Operations',
    'Attendee Experience',
    'MC AI Tools',
    'Live Sentiment',
    'Full-Stack Integration'
  ],
  members: INITIAL_TEAM_MEMBERS,
  settings: {
    autoScheduleOnDependencyChange: true,
    workDaysPerWeek: 5,
    hoursPerDay: 8,
  },
  createdAt: '2026-09-01T09:00:00Z',
  updatedAt: '2026-09-09T18:00:00Z',
  tasks: [
    // Pillar 1: Event Operations
    {
      id: 'task-101',
      title: 'Digital RSVP & Role-based Access Schema',
      description: 'Replace paper registers with digital registration workflows for organizers, volunteers, and student attendees.',
      status: 'done',
      priority: 'high',
      category: 'Event Operations',
      assigneeId: 'user-2',
      estimatedHours: 16,
      actualHours: 14,
      startDate: '2026-09-10',
      dueDate: '2026-09-12',
      progress: 100,
      dependencies: [],
      isMilestone: false,
      tags: ['Auth', 'Database', 'RBAC'],
      order: 1,
      scheduledBy: 'manual',
      comments: [
        {
          id: 'c-1',
          authorId: 'user-2',
          authorName: 'Devon Vance',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          content: 'Database tables and role permissions deployed to staging.',
          timestamp: '2026-09-12T16:30:00Z'
        }
      ]
    },
    {
      id: 'task-102',
      title: 'Event Schedule & Stage Run-of-Show Builder',
      description: 'Interactive timeline for stage segments, guest speakers, performance cues, and automated schedule notifications.',
      status: 'in_progress',
      priority: 'urgent',
      category: 'Event Operations',
      assigneeId: 'user-1',
      estimatedHours: 20,
      startDate: '2026-09-13',
      dueDate: '2026-09-16',
      progress: 65,
      dependencies: ['task-101'],
      isMilestone: false,
      tags: ['Schedule', 'Stage Ops'],
      order: 2,
      scheduledBy: 'manual',
      comments: []
    },

    // Pillar 2: Attendee Experience
    {
      id: 'task-201',
      title: 'QR Code Ticket Generation & Mobile Check-in Scanner',
      description: 'Enable instant check-in at auditorium doors via camera QR scan with offline fallback validation.',
      status: 'in_progress',
      priority: 'high',
      category: 'Attendee Experience',
      assigneeId: 'user-4',
      estimatedHours: 24,
      startDate: '2026-09-13',
      dueDate: '2026-09-17',
      progress: 40,
      dependencies: ['task-101'],
      isMilestone: false,
      tags: ['QR Scanner', 'Mobile', 'Check-in'],
      order: 3,
      scheduledBy: 'manual',
      comments: []
    },
    {
      id: 'task-202',
      title: 'Real-time Turnout & Hall Capacity Dashboard',
      description: 'Provide organizers and security with live headcounts, entrance velocity, and overflow alerts.',
      status: 'todo',
      priority: 'medium',
      category: 'Attendee Experience',
      assigneeId: 'user-4',
      estimatedHours: 16,
      startDate: '2026-09-18',
      dueDate: '2026-09-21',
      progress: 0,
      dependencies: ['task-201'],
      isMilestone: false,
      tags: ['Dashboard', 'Analytics', 'WebSockets'],
      order: 4,
      scheduledBy: 'auto_cpm',
      comments: []
    },

    // Pillar 3: MC AI Tools
    {
      id: 'task-301',
      title: 'AI Stage Script Assistant (Gemini Prompt Engine)',
      description: 'Generates speaker intros, witty transitions, contingency improvisations, and sponsor callouts based on fest agenda.',
      status: 'in_progress',
      priority: 'urgent',
      category: 'MC AI Tools',
      assigneeId: 'user-3',
      estimatedHours: 28,
      startDate: '2026-09-14',
      dueDate: '2026-09-19',
      progress: 50,
      dependencies: ['task-102'],
      isMilestone: false,
      tags: ['Gemini API', 'Scripting', 'NLP'],
      order: 5,
      scheduledBy: 'manual',
      comments: [
        {
          id: 'c-2',
          authorId: 'user-1',
          authorName: 'Akshaya M.',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: 'Added prompt templates for chief guest delays and technical glitch fill-ins.',
          timestamp: '2026-09-15T11:20:00Z'
        }
      ]
    },
    {
      id: 'task-302',
      title: 'Voice-Cue Teleprompter with Dynamic Auto-Scroll',
      description: 'Hands-free teleprompter display listening to speech cues to advance stage script smoothly without manual scrolling.',
      status: 'todo',
      priority: 'high',
      category: 'MC AI Tools',
      assigneeId: 'user-3',
      estimatedHours: 32,
      startDate: '2026-09-20',
      dueDate: '2026-09-25',
      progress: 0,
      dependencies: ['task-301'],
      isMilestone: true,
      tags: ['Speech API', 'Teleprompter', 'Voice UI'],
      order: 6,
      scheduledBy: 'auto_cpm',
      comments: []
    },

    // Pillar 4: Live Sentiment
    {
      id: 'task-401',
      title: 'In-Event Audience Live Sentiment & Emoji Reaction Feed',
      description: 'Lightweight attendee mobile web reaction bar (fire, applause, curious, laugh) with zero-login join via seat QR.',
      status: 'todo',
      priority: 'medium',
      category: 'Live Sentiment',
      assigneeId: 'user-4',
      estimatedHours: 20,
      startDate: '2026-09-22',
      dueDate: '2026-09-25',
      progress: 0,
      dependencies: ['task-201'],
      isMilestone: false,
      tags: ['Real-time', 'Audience', 'Reactions'],
      order: 7,
      scheduledBy: 'auto_cpm',
      comments: []
    },
    {
      id: 'task-402',
      title: 'Real-time Pacing & Energy Feedback HUD for MC Ear-monitor',
      description: 'Displays rolling audience engagement score so MCs know when to accelerate, tell a story, or ramp up crowd energy.',
      status: 'todo',
      priority: 'high',
      category: 'Live Sentiment',
      assigneeId: 'user-1',
      estimatedHours: 18,
      startDate: '2026-09-26',
      dueDate: '2026-09-29',
      progress: 0,
      dependencies: ['task-302', 'task-401'],
      isMilestone: false,
      tags: ['MC HUD', 'Sentiment Analysis', 'Live Pacing'],
      order: 8,
      scheduledBy: 'auto_cpm',
      comments: []
    },

    // Pillar 5: Full-Stack Integration & Launch
    {
      id: 'task-501',
      title: 'End-to-End Dry Run & Stage Load Testing',
      description: 'Simulate 1,500 simultaneous QR check-ins, concurrent reactions, and live teleprompter sync under campus Wi-Fi constraints.',
      status: 'backlog',
      priority: 'urgent',
      category: 'Full-Stack Integration',
      assigneeId: 'user-2',
      estimatedHours: 22,
      startDate: '2026-09-30',
      dueDate: '2026-10-04',
      progress: 0,
      dependencies: ['task-202', 'task-402'],
      isMilestone: true,
      tags: ['Stress Test', 'Stage Rehearsal', 'DevOps'],
      order: 9,
      scheduledBy: 'auto_cpm',
      comments: []
    },
    {
      id: 'task-502',
      title: 'Volunteer Briefing & Final MC Dress Rehearsal',
      description: 'Full-dress walkthrough in auditorium with stage lighting, wireless mic testing, and volunteer scanner stations.',
      status: 'backlog',
      priority: 'high',
      category: 'Full-Stack Integration',
      assigneeId: 'user-5',
      estimatedHours: 12,
      startDate: '2026-10-05',
      dueDate: '2026-10-07',
      progress: 0,
      dependencies: ['task-501'],
      isMilestone: true,
      tags: ['Rehearsal', 'Volunteers', 'Auditorium'],
      order: 10,
      scheduledBy: 'auto_cpm',
      comments: []
    },
    {
      id: 'task-503',
      title: 'Grand College Fest Opening Ceremony Live Production',
      description: 'Launch event with active attendee check-in, real-time stage teleprompter, and live crowd sentiment metrics.',
      status: 'backlog',
      priority: 'urgent',
      category: 'Full-Stack Integration',
      assigneeId: 'user-1',
      estimatedHours: 16,
      startDate: '2026-10-08',
      dueDate: '2026-10-09',
      progress: 0,
      dependencies: ['task-502'],
      isMilestone: true,
      tags: ['Live Event', 'Milestone', 'Production'],
      order: 11,
      scheduledBy: 'auto_cpm',
      comments: []
    }
  ]
};
