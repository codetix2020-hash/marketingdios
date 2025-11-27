import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/tabs'
import { Activity, Brain, Zap, TrendingUp, DollarSign, Users, Target, AlertTriangle, Clock, Database, Shield, Cpu } from 'lucide-react'

export default async function GodModePage() {
  return (
    <div className="space-y-6 p-6">
      {/* HERO SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            God Mode Control Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema de marketing autónomo operando 24/7
          </p>
        </div>
        <div className="flex gap-2">
          <SystemStatusBadge />
          <AutopilotToggle />
        </div>
      </div>

      {/* MÉTRICAS EN TIEMPO REAL */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue Generado"
          value="€12,450"
          change="+23.5%"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Leads Capturados"
          value="1,247"
          change="+18.2%"
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Contenido Creado"
          value="156"
          change="+45 hoy"
          icon={Zap}
          trend="neutral"
        />
        <MetricCard
          title="CAC Promedio"
          value="€9.50"
          change="-32.1%"
          icon={Target}
          trend="up"
        />
      </div>

      {/* TABS PRINCIPALES */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Brain className="h-4 w-4 mr-2" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="content">
            <Zap className="h-4 w-4 mr-2" />
            Contenido
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campañas
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <OrchestrationTimeline />
            <SystemHealthMonitor />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <RecentDecisions />
            <ActiveJobs />
            <GuardsStatus />
          </div>
        </TabsContent>

        {/* TAB 2: AGENTES */}
        <TabsContent value="agents" className="space-y-4">
          <AgentsGrid />
        </TabsContent>

        {/* TAB 3: CONTENIDO */}
        <TabsContent value="content" className="space-y-4">
          <ContentPipeline />
          <ViralBlueprintsGallery />
        </TabsContent>

        {/* TAB 4: CAMPAÑAS */}
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsTable />
          <BudgetDistribution />
        </TabsContent>

        {/* TAB 5: ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <PerformanceCharts />
        </TabsContent>

        {/* TAB 6: ALERTAS */}
        <TabsContent value="alerts" className="space-y-4">
          <AlertsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// COMPONENTES VISUALES

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
          {change} vs mes anterior
        </p>
      </CardContent>
    </Card>
  )
}

function SystemStatusBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900">
      <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
      <span className="text-sm font-medium">Sistema Activo</span>
    </div>
  )
}

function AutopilotToggle() {
  return (
    <button className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all">
      Autopilot: ON
    </button>
  )
}

function OrchestrationTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Próxima Orquestación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Próximo ciclo en:</span>
            <span className="text-2xl font-mono font-bold text-purple-600">02:34:18</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 w-3/4 transition-all" />
          </div>
          <div className="text-sm text-muted-foreground">
            Última ejecución: hace 3h 26min
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SystemHealthMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Salud del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <HealthBar label="Agentes" value={100} />
          <HealthBar label="Base de Datos" value={98} />
          <HealthBar label="APIs Externas" value={95} />
          <HealthBar label="Guardias" value={100} />
        </div>
      </CardContent>
    </Card>
  )
}

interface HealthBarProps {
  label: string
  value: number
}

function HealthBar({ label, value }: HealthBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${value > 95 ? 'bg-green-600' : value > 80 ? 'bg-yellow-600' : 'bg-red-600'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function RecentDecisions() {
  const decisions = [
    { time: '14:30', action: 'Generó 5 posts virales', status: 'success' },
    { time: '13:15', action: 'Optimizó campaña FB', status: 'success' },
    { time: '12:00', action: 'Pausó anuncio bajo ROI', status: 'warning' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decisiones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {decisions.map((decision, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`h-2 w-2 rounded-full mt-2 ${decision.status === 'success' ? 'bg-green-600' : 'bg-yellow-600'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{decision.action}</div>
                <div className="text-xs text-muted-foreground">{decision.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActiveJobs() {
  const jobs = [
    { name: 'Content Generator', status: 'running', progress: 75 },
    { name: 'SEO Analyzer', status: 'running', progress: 45 },
    { name: 'Ads Optimizer', status: 'queued', progress: 0 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jobs Activos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{job.name}</span>
                <span className="text-xs text-muted-foreground">
                  {job.status === 'running' ? `${job.progress}%` : 'En cola'}
                </span>
              </div>
              {job.status === 'running' && (
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GuardsStatus() {
  const guards = [
    { name: 'Budget Guard', status: 'active', alerts: 0 },
    { name: 'Brand Safety', status: 'active', alerts: 0 },
    { name: 'Performance Guard', status: 'active', alerts: 2 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Estado de Guardias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {guards.map((guard, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                <span className="text-sm">{guard.name}</span>
              </div>
              {guard.alerts > 0 && (
                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 px-2 py-1 rounded-full">
                  {guard.alerts} alertas
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AgentsGrid() {
  const agents = [
    { 
      name: 'Meta-Agente Orquestador', 
      status: 'active', 
      lastAction: 'Planificó 12 contenidos', 
      efficiency: 98 
    },
    { 
      name: 'Agente de Contenido', 
      status: 'active', 
      lastAction: 'Generó 8 posts', 
      efficiency: 95 
    },
    { 
      name: 'Agente Visual', 
      status: 'active', 
      lastAction: 'Creó 15 imágenes', 
      efficiency: 92 
    },
    { 
      name: 'Agente de Ventas', 
      status: 'active', 
      lastAction: 'Calificó 45 leads', 
      efficiency: 97 
    },
    { 
      name: 'Agente de ADS', 
      status: 'active', 
      lastAction: 'Optimizó 3 campañas', 
      efficiency: 94 
    },
    { 
      name: 'Workflow Builder', 
      status: 'idle', 
      lastAction: 'Esperando tareas', 
      efficiency: 100 
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <Card key={agent.name} className="relative overflow-hidden transition-all hover:shadow-lg">
          <div className={`absolute top-0 left-0 w-1 h-full ${agent.status === 'active' ? 'bg-green-600' : 'bg-gray-400'}`} />
          <CardHeader>
            <CardTitle className="text-base">{agent.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-muted-foreground">
                {agent.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm">{agent.lastAction}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Eficiencia</span>
              <span className="text-sm font-mono font-bold">{agent.efficiency}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ContentPipeline() {
  const pipeline = [
    { stage: 'Generando', count: 8, color: 'bg-blue-600' },
    { stage: 'Optimizando', count: 5, color: 'bg-yellow-600' },
    { stage: 'Revisión', count: 3, color: 'bg-purple-600' },
    { stage: 'Programado', count: 12, color: 'bg-green-600' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline de Contenido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {pipeline.map((stage) => (
            <div key={stage.stage} className="text-center">
              <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                <div className="text-3xl font-bold">{stage.count}</div>
              </div>
              <div className="text-sm text-muted-foreground">{stage.stage}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ViralBlueprintsGallery() {
  const blueprints = [
    { platform: 'Instagram', hook: 'POV: Cuando descubres...', performance: '2.3M views' },
    { platform: 'TikTok', hook: '3 cosas que nadie te dice...', performance: '1.8M views' },
    { platform: 'Twitter', hook: 'Hot take:', performance: '450K views' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estructuras Virales Detectadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {blueprints.map((blueprint, i) => (
            <div key={i} className="p-4 border rounded-lg hover:border-purple-600 transition-all">
              <div className="text-sm font-medium text-purple-600 mb-2">{blueprint.platform}</div>
              <div className="text-sm mb-2">{blueprint.hook}</div>
              <div className="text-xs text-muted-foreground">{blueprint.performance}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CampaignsTable() {
  const campaigns = [
    { name: 'Campaign A', platform: 'Facebook', spend: '€450', roas: '3.2x', status: 'active' },
    { name: 'Campaign B', platform: 'Google', spend: '€680', roas: '2.8x', status: 'active' },
    { name: 'Campaign C', platform: 'Instagram', spend: '€320', roas: '4.1x', status: 'active' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campañas Activas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.map((campaign, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{campaign.name}</div>
                <div className="text-sm text-muted-foreground">{campaign.platform}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{campaign.roas}</div>
                <div className="text-sm text-muted-foreground">{campaign.spend}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function BudgetDistribution() {
  const distribution = [
    { platform: 'Facebook Ads', budget: 40, color: 'bg-blue-600' },
    { platform: 'Google Ads', budget: 35, color: 'bg-red-600' },
    { platform: 'Instagram Ads', budget: 25, color: 'bg-pink-600' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.platform}>
              <div className="flex justify-between text-sm mb-2">
                <span>{item.platform}</span>
                <span className="font-mono font-bold">{item.budget}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} transition-all`}
                  style={{ width: `${item.budget}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Gasto (Últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Gráfico de líneas aquí]
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leads por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Gráfico de barras aquí]
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AlertsList() {
  const alerts = [
    { 
      type: 'warning', 
      message: 'Campaña "Summer Sale" superó el 90% del budget diario', 
      time: 'hace 15 min' 
    },
    { 
      type: 'info', 
      message: 'Nueva estructura viral detectada en TikTok', 
      time: 'hace 1h' 
    },
    { 
      type: 'success', 
      message: 'Meta-Agente completó ciclo de orquestación exitosamente', 
      time: 'hace 3h' 
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle 
                className={`h-5 w-5 mt-0.5 ${
                  alert.type === 'warning' ? 'text-yellow-600' : 
                  alert.type === 'info' ? 'text-blue-600' : 
                  'text-green-600'
                }`} 
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{alert.message}</div>
                <div className="text-xs text-muted-foreground">{alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
