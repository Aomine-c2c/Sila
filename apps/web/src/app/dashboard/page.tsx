import { 
  Bot, 
  GitBranch, 
  Users, 
  Brain, 
  Shield, 
  Database, 
  FileText, 
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const stats = [
  { 
    name: 'Active Agents', 
    value: '24', 
    change: '+3', 
    trend: 'up',
    icon: Bot,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  { 
    name: 'Running Workflows', 
    value: '12', 
    change: '+2', 
    trend: 'up',
    icon: GitBranch,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  { 
    name: 'Council Deliberations', 
    value: '5', 
    change: '0', 
    trend: 'neutral',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-500/10'
  },
  { 
    name: 'Memory Items', 
    value: '1,247', 
    change: '+89', 
    trend: 'up',
    icon: Brain,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10'
  },
  { 
    name: 'Pending Approvals', 
    value: '3', 
    change: '-1', 
    trend: 'down',
    icon: Shield,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10'
  },
  { 
    name: 'Resource Utilization', 
    value: '67%', 
    change: '+5%', 
    trend: 'up',
    icon: Database,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
];

const recentActivity = [
  { 
    id: 1, 
    type: 'workflow_completed', 
    title: 'Software Delivery Pipeline completed', 
    description: 'Build Real-Time Notification Service',
    timestamp: '2 min ago',
    status: 'success',
    icon: CheckCircle,
    color: 'text-green-400'
  },
  { 
    id: 2, 
    type: 'approval_required', 
    title: 'CTO Approval required', 
    description: 'Architecture review for Payment Service',
    timestamp: '15 min ago',
    status: 'pending',
    icon: Clock,
    color: 'text-yellow-400'
  },
  { 
    id: 3, 
    type: 'council_decision', 
    title: 'Architecture Council decision ratified', 
    description: 'Adopt Event-Driven Architecture with Transactional Outbox',
    timestamp: '1 hour ago',
    status: 'success',
    icon: Users,
    color: 'text-blue-400'
  },
  { 
    id: 4, 
    type: 'agent_blocked', 
    title: 'Security Agent blocked', 
    description: 'Resource limit exceeded - Intelligence pool',
    timestamp: '2 hours ago',
    status: 'warning',
    icon: AlertTriangle,
    color: 'text-red-400'
  },
  { 
    id: 5, 
    type: 'memory_created', 
    title: 'New organizational memory recorded', 
    description: 'Decision record: API Gateway Migration',
    timestamp: '3 hours ago',
    status: 'info',
    icon: Brain,
    color: 'text-purple-400'
  },
];

const quickActions = [
  { name: 'Create Agent', href: '/agents/new', icon: Bot, color: 'bg-blue-500/10 text-blue-400' },
  { name: 'New Workflow', href: '/workflows/new', icon: GitBranch, color: 'bg-purple-500/10 text-purple-400' },
  { name: 'Convene Council', href: '/councils/new', icon: Users, color: 'bg-green-500/10 text-green-400' },
  { name: 'Record Decision', href: '/governance/decisions/new', icon: FileText, color: 'bg-orange-500/10 text-orange-400' },
  { name: 'Allocate Resources', href: '/resources/requests/new', icon: Database, color: 'bg-cyan-500/10 text-cyan-400' },
  { name: 'Search Memory', href: '/memory/search', icon: Brain, color: 'bg-pink-500/10 text-pink-400' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your autonomous organization
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/agents/new" className="btn-primary">
            <Bot className="h-4 w-4" />
            New Agent
          </a>
          <a href="/workflows/new" className="btn-secondary">
            <GitBranch className="h-4 w-4" />
            New Workflow
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="relative overflow-hidden">
              <div className={cn('absolute top-0 right-0 h-32 w-32 opacity-10', stat.bg)} />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' && (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">{stat.change}</span>
                        </>
                      )}
                      {stat.trend === 'down' && (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-red-400" />
                          <span className="text-sm font-medium text-red-400">{stat.change}</span>
                        </>
                      )}
                      {stat.trend === 'neutral' && (
                        <span className="text-sm font-medium text-muted-foreground">{stat.change}</span>
                      )}
                      <span className="text-xs text-muted-foreground">vs last week</span>
                    </div>
                  </div>
                  <div className={cn('p-3 rounded-xl', stat.bg)}>
                    <Icon className={cn('h-7 w-7', stat.color)} aria-hidden="true" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <a href="/activity" className="text-sm text-primary hover:underline">
              View all
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', activity.color + '/10')}>
                      <Icon className={cn('h-5 w-5', activity.color)} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                      <Badge variant={
                        activity.status === 'success' ? 'success' :
                        activity.status === 'pending' ? 'warning' :
                        activity.status === 'warning' ? 'destructive' : 'default'
                      } className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a 
                  key={action.name} 
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', action.color)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span>{action.name}</span>
                </a>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'API Health', status: 'healthy', value: '99.9%', icon: Activity, color: 'text-green-400' },
          { name: 'Agent Runtime', status: 'healthy', value: '24/24', icon: Bot, color: 'text-blue-400' },
          { name: 'Vector DB', status: 'healthy', value: '1.2M vecs', icon: Database, color: 'text-purple-400' },
          { name: 'LLM Providers', status: 'degraded', value: '3/4', icon: Zap, color: 'text-yellow-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.name}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                  </div>
                  <div className={cn('p-2 rounded-lg', item.color + '/10')}>
                    <Icon className={cn('h-5 w-5', item.color)} aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={cn(
                    'h-2 w-2 rounded-full',
                    item.status === 'healthy' ? 'bg-green-400' :
                    item.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  )} />
                  <span className="text-sm text-muted-foreground capitalize">{item.status}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}