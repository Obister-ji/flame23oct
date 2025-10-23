import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  Users,
  Target,
  Zap
} from 'lucide-react';
import Taskmanagement from '@/assets/Taskmanagement.png';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate: string;
  assignee?: string;
  createdAt: string;
}

const TaskForce = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design new dashboard layout',
      description: 'Create mockups for the analytics dashboard with improved UX',
      priority: 'high',
      status: 'in-progress',
      dueDate: '2024-12-25',
      assignee: 'John Doe',
      createdAt: '2024-12-20'
    },
    {
      id: '2',
      title: 'Implement user authentication',
      description: 'Add OAuth2 integration for Google and GitHub',
      priority: 'high',
      status: 'todo',
      dueDate: '2024-12-28',
      assignee: 'Jane Smith',
      createdAt: '2024-12-20'
    },
    {
      id: '3',
      title: 'Write API documentation',
      description: 'Document all REST API endpoints with examples',
      priority: 'medium',
      status: 'todo',
      dueDate: '2025-01-05',
      assignee: 'Mike Johnson',
      createdAt: '2024-12-20'
    }
  ]);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignee: ''
  });
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

  // Task statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
  };

  const filteredTasks = tasks.filter(task => 
    filter === 'all' || task.status === filter
  );

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate,
      assignee: newTask.assignee,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignee: ''
    });
    setShowAddTask(false);
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'todo': return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/5 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/10 float" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <Badge className="mb-4 bg-accent/10 text-accent">
                  <Zap className="w-4 h-4 mr-2" />
                  PREMIUM AGENT
                </Badge>
                <h1 className="font-display text-5xl md:text-6xl font-bold text-primary mb-6">
                  Task-<span className="text-accent">Force</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Intelligent Task Management Tool
                </p>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Streamline your workflow with AI-powered task management. 
                  Organize, prioritize, and track your team's productivity with intelligent automation.
                </p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center">
                    <div className="flex text-accent">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-2xl">★</span>
                      ))}
                    </div>
                    <span className="ml-2 text-muted-foreground">4.9/5 Ability</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button className="btn-hero">
                    <Target className="w-5 h-5 mr-2" />
                    Start Managing Tasks
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/agents')}>
                    View Other Agents
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <img 
                  src={Taskmanagement} 
                  alt="TASK-FORCE Agent" 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Dashboard */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{stats.todo}</div>
                <p className="text-sm text-muted-foreground">To Do</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-600">{stats.highPriority}</div>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Task Management Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Task List */}
              <div className="flex-1">
                <div className="bg-card rounded-xl shadow-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary">Task List</h2>
                    <Button 
                      onClick={() => setShowAddTask(true)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                  
                  {/* Filter Tabs */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {[
                      { key: 'all', label: 'All Tasks' },
                      { key: 'todo', label: 'To Do' },
                      { key: 'in-progress', label: 'In Progress' },
                      { key: 'completed', label: 'Completed' }
                    ].map(({ key, label }) => (
                      <Button
                        key={key}
                        variant={filter === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(key as any)}
                        className="mb-2"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>

                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {filteredTasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => {
                                  const newStatus = 
                                    task.status === 'todo' ? 'in-progress' :
                                    task.status === 'in-progress' ? 'completed' : 'todo';
                                  updateTaskStatus(task.id, newStatus);
                                }}
                                className="mt-1"
                              >
                                {getStatusIcon(task.status)}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                                      {task.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {task.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3">
                                      <Badge className={getPriorityColor(task.priority)}>
                                        {task.priority}
                                      </Badge>
                                      {task.dueDate && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <Calendar className="w-4 h-4 mr-1" />
                                          {task.dueDate}
                                        </div>
                                      )}
                                      {task.assignee && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <Users className="w-4 h-4 mr-1" />
                                          {task.assignee}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTask(task.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {filteredTasks.length === 0 && (
                        <div className="text-center py-12">
                          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No tasks found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Add Task Form / Analytics */}
              <div className="lg:w-96">
                {showAddTask ? (
                  <Card className="shadow-lg border border-border">
                    <CardHeader>
                      <CardTitle>Add New Task</CardTitle>
                      <CardDescription>Create a new task for your team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                          id="title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                          placeholder="Enter task description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <select
                          id="priority"
                          value={newTask.priority}
                          onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                          className="w-full p-2 border border-border rounded-md bg-background"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignee">Assignee</Label>
                        <Input
                          id="assignee"
                          value={newTask.assignee}
                          onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                          placeholder="Assign to..."
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={addTask} className="flex-1">
                          Add Task
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddTask(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-lg border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Task Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Completion Rate</span>
                            <span>{Math.round((stats.completed / stats.total) * 100) || 0}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(stats.completed / stats.total) * 100 || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Priority Distribution</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                High Priority
                              </span>
                              <span>{tasks.filter(t => t.priority === 'high').length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                Medium Priority
                              </span>
                              <span>{tasks.filter(t => t.priority === 'medium').length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                Low Priority
                              </span>
                              <span>{tasks.filter(t => t.priority === 'low').length}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="pt-4">
                          <Button 
                            onClick={() => setShowAddTask(true)}
                            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Task
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TaskForce;