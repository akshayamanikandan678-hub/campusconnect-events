import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PROJECT, INITIAL_TEAM_MEMBERS } from './src/defaultData.ts';
import { Project, Task, ChatMessage, UserPresence, WebSocketPayload } from './src/types.ts';
import { computeAutomatedSchedule } from './src/utils/scheduler.ts';

dotenv.config();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;
app.use(express.json());

// In-memory data store
const projects = new Map<string, Project>();
projects.set(INITIAL_PROJECT.id, JSON.stringify(INITIAL_PROJECT) ? JSON.parse(JSON.stringify(INITIAL_PROJECT)) : INITIAL_PROJECT);

// In-memory chat history per project
const projectChats = new Map<string, ChatMessage[]>();
projectChats.set(INITIAL_PROJECT.id, [
  {
    id: 'msg-1',
    senderId: 'user-1',
    senderName: 'Akshaya M. (Lead / MC)',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    senderColor: '#3B82F6',
    text: 'Welcome to CampusConnect! Digital RSVP schema is complete, and we are working on the stage teleprompter and QR check-in.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'msg-2',
    senderId: 'user-3',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    senderColor: '#8B5CF6',
    text: 'The Gemini prompt templates for AI Script Assistant are ready for testing with stage scenarios.',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
]);

// Presence tracking: socket -> UserPresence
const socketPresence = new Map<WebSocket, { projectId: string; presence: UserPresence }>();

// API Routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// List all projects
app.get('/api/projects', (req, res) => {
  const list = Array.from(projects.values()).map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    startDate: p.startDate,
    targetDeadline: p.targetDeadline,
    taskCount: p.tasks.length,
    completedTaskCount: p.tasks.filter(t => t.status === 'done').length,
    members: p.members,
    updatedAt: p.updatedAt
  }));
  res.json(list);
});

// Get a specific project
app.get('/api/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Create a new project
app.post('/api/projects', (req, res) => {
  const { title, description, startDate, targetDeadline, categories } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const id = 'proj-' + Date.now();
  const newProject: Project = {
    id,
    title,
    description: description || '',
    startDate: startDate || new Date().toISOString().split('T')[0],
    targetDeadline: targetDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    categories: categories && categories.length > 0 ? categories : ['General', 'Development', 'Operations'],
    members: INITIAL_TEAM_MEMBERS,
    tasks: [],
    settings: {
      autoScheduleOnDependencyChange: true,
      workDaysPerWeek: 5,
      hoursPerDay: 8
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.set(id, newProject);
  projectChats.set(id, []);
  res.status(201).json(newProject);
});

// Update an existing project
app.put('/api/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updated: Project = {
    ...project,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  projects.set(req.params.id, updated);
  res.json(updated);
});

// Reset project back to default CampusConnect
app.post('/api/projects/:id/reset', (req, res) => {
  if (req.params.id === INITIAL_PROJECT.id) {
    const clone: Project = JSON.parse(JSON.stringify(INITIAL_PROJECT));
    projects.set(INITIAL_PROJECT.id, clone);
    return res.json(clone);
  }
  res.status(400).json({ error: 'Only default project can be reset.' });
});

// Run Constraint-based Automated Scheduler (CPM + Resource constraints)
app.post('/api/projects/:id/auto-schedule', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { applyChanges, levelResources } = req.body;

  const result = computeAutomatedSchedule(
    project.tasks,
    project.members,
    project.startDate,
    project.targetDeadline,
    project.settings.hoursPerDay || 8,
    !!levelResources
  );

  if (applyChanges) {
    project.tasks = result.updatedTasks;
    project.updatedAt = new Date().toISOString();
    projects.set(project.id, project);

    // Broadcast schedule update via WebSockets
    broadcastToProject(project.id, {
      type: 'schedule:apply',
      tasks: project.tasks,
      broadcastBy: 'System Auto-Scheduler'
    });
  }

  res.json(result);
});

// AI-powered Task Breakdown Generator (Gemini 3.8 Flash)
app.post('/api/projects/:id/ai-breakdown', async (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { prompt } = req.body;
  const userGoal = prompt || project.description || project.title;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Fallback generator when GEMINI_API_KEY is not configured
      const generatedTasks: Partial<Task>[] = [
        {
          title: `Architecture Design for ${userGoal.slice(0, 40)}`,
          description: 'Establish technical baseline, database schema, and interface contracts.',
          category: project.categories[0] || 'Planning',
          estimatedHours: 16,
          priority: 'high',
          dependencies: []
        },
        {
          title: `Prototype Core Workflow`,
          description: 'Build initial functional prototype and validate with team members.',
          category: project.categories[1] || 'Development',
          estimatedHours: 24,
          priority: 'high',
          dependencies: []
        },
        {
          title: `Integration & Real-time Verification`,
          description: 'Perform end-to-end testing, error recovery, and load checks.',
          category: project.categories[2] || 'Testing',
          estimatedHours: 18,
          priority: 'urgent',
          dependencies: []
        }
      ];
      return res.json({ tasks: generatedTasks, aiPowered: false });
    }

    const systemPrompt = `You are a project management and automated scheduling specialist.
Generate 4 to 7 structured, actionable project tasks for: "${userGoal}".
The project has team members:
${project.members.map(m => `- ${m.name} (${m.role})`).join('\n')}
Available categories: ${project.categories.join(', ')}.

Respond ONLY with a JSON array of task objects with this exact structure:
[
  {
    "title": "Task title (concise and action-oriented)",
    "description": "Clear functional deliverable description",
    "category": "one of the available categories",
    "assigneeName": "one of the team members' names",
    "estimatedHours": number between 6 and 40,
    "priority": "low" | "medium" | "high" | "urgent",
    "isMilestone": boolean,
    "tags": ["Tag1", "Tag2"],
    "dependsOnIndices": [array of zero-based indices in this output list that this task depends on, e.g. [0]]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ tasks: parsed, aiPowered: true });
  } catch (error: any) {
    console.error('Gemini breakdown error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate task breakdown' });
  }
});

// AI Schedule Optimizer & Bottleneck Analysis
app.post('/api/projects/:id/ai-optimize', async (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        analysis: 'Gemini API key is not configured. Using standard constraint-based CPM scheduler for automated leveling.',
        recommendations: [
          'Parallelize non-dependent tasks between Event Operations and MC AI Tools to reduce critical path by ~4 days.',
          'Add a 2-day buffer prior to Grand College Fest Opening Ceremony for contingency.'
        ],
        aiPowered: false
      });
    }

    const taskSummary = project.tasks.map(t => ({
      id: t.id,
      title: t.title,
      durationHours: t.estimatedHours,
      assignee: project.members.find(m => m.id === t.assigneeId)?.name || 'Unassigned',
      dependencies: t.dependencies,
      start: t.startDate,
      due: t.dueDate,
      priority: t.priority
    }));

    const prompt = `Analyze this project schedule for bottlenecks, dependency risks, and workload imbalances:
Project Title: ${project.title}
Target Deadline: ${project.targetDeadline}
Tasks: ${JSON.stringify(taskSummary, null, 2)}

Provide an expert optimization report in JSON format:
{
  "executiveSummary": "2-3 concise sentences assessing schedule viability against the deadline",
  "criticalPathRisks": ["Risk 1", "Risk 2"],
  "workloadBalancingTips": ["Tip 1", "Tip 2"],
  "recommendedBufferDays": 3
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ ...data, aiPowered: true });
  } catch (error: any) {
    console.error('Gemini optimize error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze schedule' });
  }
});

// Create HTTP and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastToProject(projectId: string, payload: WebSocketPayload, excludeSocket?: WebSocket) {
  const msgStr = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== excludeSocket) {
      const info = socketPresence.get(client);
      if (info && info.projectId === projectId) {
        client.send(msgStr);
      }
    }
  });
}

function getProjectPresenceList(projectId: string): UserPresence[] {
  const list: UserPresence[] = [];
  const seenUsers = new Set<string>();
  socketPresence.forEach((info) => {
    if (info.projectId === projectId && !seenUsers.has(info.presence.userId)) {
      seenUsers.add(info.presence.userId);
      list.push(info.presence);
    }
  });
  return list;
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'join') {
        const { projectId, user } = data;
        socketPresence.set(ws, { projectId, presence: user });

        // Send current presence list to the new user
        const currentUsers = getProjectPresenceList(projectId);
        ws.send(JSON.stringify({
          type: 'presence:state',
          users: currentUsers
        }));

        // Broadcast to others that this user joined
        broadcastToProject(projectId, {
          type: 'presence:update',
          user
        }, ws);

        // Also send existing chat messages
        const chats = projectChats.get(projectId) || [];
        chats.forEach(msg => {
          ws.send(JSON.stringify({ type: 'chat:message', message: msg }));
        });
        return;
      }

      const clientInfo = socketPresence.get(ws);
      if (!clientInfo) return;
      const { projectId } = clientInfo;

      if (data.type === 'presence:update') {
        clientInfo.presence = { ...clientInfo.presence, ...data.user };
        broadcastToProject(projectId, {
          type: 'presence:update',
          user: clientInfo.presence
        });
      } else if (data.type === 'presence:cursor') {
        broadcastToProject(projectId, {
          type: 'presence:cursor',
          userId: clientInfo.presence.userId,
          x: data.x,
          y: data.y
        }, ws);
      } else if (data.type === 'task:upsert') {
        const project = projects.get(projectId);
        if (project) {
          const idx = project.tasks.findIndex(t => t.id === data.task.id);
          if (idx >= 0) {
            project.tasks[idx] = data.task;
          } else {
            project.tasks.push(data.task);
          }
          project.updatedAt = new Date().toISOString();
        }
        broadcastToProject(projectId, {
          type: 'task:upsert',
          task: data.task,
          broadcastBy: clientInfo.presence.userName
        }, ws);
      } else if (data.type === 'task:delete') {
        const project = projects.get(projectId);
        if (project) {
          project.tasks = project.tasks.filter(t => t.id !== data.taskId);
          project.updatedAt = new Date().toISOString();
        }
        broadcastToProject(projectId, {
          type: 'task:delete',
          taskId: data.taskId,
          broadcastBy: clientInfo.presence.userName
        }, ws);
      } else if (data.type === 'chat:message') {
        const chats = projectChats.get(projectId) || [];
        chats.push(data.message);
        // keep last 100 messages
        if (chats.length > 100) chats.shift();
        projectChats.set(projectId, chats);

        broadcastToProject(projectId, {
          type: 'chat:message',
          message: data.message
        });
      }
    } catch (err) {
      console.error('WebSocket message parse error:', err);
    }
  });

  ws.on('close', () => {
    const info = socketPresence.get(ws);
    if (info) {
      const { projectId, presence } = info;
      socketPresence.delete(ws);
      const remainingUsers = getProjectPresenceList(projectId);
      broadcastToProject(projectId, {
        type: 'presence:state',
        users: remainingUsers
      });
    }
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncPlan project management server listening on port ${PORT}`);
  });
}

startServer();
