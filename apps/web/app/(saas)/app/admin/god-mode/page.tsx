import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/tabs'
import { Activity, Brain, Zap, TrendingUp, DollarSign, Users, Target, AlertTriangle, Clock, Shield, Cpu } from 'lucide-react'
import { orpcClient } from '@shared/lib/orpc-client'
import { getSession, getOrganizationList } from '@saas/auth/lib/server'
import { redirect } from 'next/navigation'
import { SeedMemoryButton } from './components/SeedMemoryButton'

export default async function GodModePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Get active organization
  const organizations = await getOrganizationList()
  const activeOrganizationId = session.session.activeOrganizationId || organizations[0]?.id

  if (!activeOrganizationId) {
    redirect('/new-organization')
  }

  // Fetch real-time stats
  let stats
  try {
    stats = await orpcClient.marketing.godMode.getStats({
      organizationId: activeOrganizationId,
    })
  } catch (error) {
    console.error('Error fetching God Mode stats:', error)
    // Retornar datos por defecto si falla
    stats = {
      metrics: {
        revenue: 0,
        revenueChange: 0,
        leads: 0,
        leadsChange: 0,
        contentCreated: 0,
        contentToday: 0,
        cac: 0,
        cacChange: 0,
      },
      orchestration: {
        nextCycle: new Date(Date.now() + 6 * 60 * 60 * 1000),
        lastExecution: new Date(),
      },
      systemHealth: {
        agents: 0,
        database: 0,
        apis: 0,
        guards: 0,
      },
      agents: [],
      recentDecisions: [],
      activeJobs: [],
      guards: {
        financial: 0,
        reputation: 0,
        legal: 0,
        alerts: 0,
      },
      activeCampaigns: 0,
    }
  }

  // nextCycle puede venir como string ISO o Date
  const nextCycleDate = stats.orchestration.nextCycle instanceof Date 
    ? stats.orchestration.nextCycle 
    : new Date(stats.orchestration.nextCycle || Date.now() + 6 * 60 * 60 * 1000)
  const timeUntilNext = Math.max(0, Math.floor((nextCycleDate.getTime() - Date.now()) / 1000))
  const hours = Math.floor(timeUntilNext / 3600)
  const minutes = Math.floor((timeUntilNext % 3600) / 60)
  const seconds = timeUntilNext % 60

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
          value={`€${stats.metrics.revenue.toLocaleString()}`}
          change={`+${stats.metrics.revenueChange}%`}
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Leads Capturados"
          value={stats.metrics.leads.toLocaleString()}
          change={`+${stats.metrics.leadsChange}%`}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Contenido Creado"
          value={stats.metrics.contentCreated.toString()}
          change={`+${stats.metrics.contentToday} hoy`}
          icon={Zap}
          trend="neutral"
        />
        <MetricCard
          title="CAC Promedio"
          value={`€${stats.metrics.cac}`}
          change={`${stats.metrics.cacChange}%`}
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
            <OrchestrationTimeline hours={hours} minutes={minutes} seconds={seconds} />
            <SystemHealthMonitor health={stats.systemHealth} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <RecentDecisions decisions={stats.recentDecisions} />
            <ActiveJobs jobs={stats.activeJobs} />
            <GuardsStatus guards={stats.guards} />
          </div>
        </TabsContent>

        {/* TAB 2: AGENTES */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configuración de Memoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Pobla la memoria inicial de MarketingOS con el ADN de CodeTix, productos, casos de éxito y estrategias.
              </p>
              <SeedMemoryButton organizationId={activeOrganizationId} />
            </CardContent>
          </Card>
          <AgentsGrid agents={stats.agents} />
        </TabsContent>

        {/* TAB 3: CONTENIDO */}
        <TabsContent value="content" className="space-y-4">
          <ContentPipeline />
          <ViralBlueprintsGallery />
        </TabsContent>

        {/* TAB 4: CAMPAÑAS */}
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsTable count={stats.activeCampaigns} />
          <BudgetDistribution />
        </TabsContent>

        {/* TAB 5: ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <PerformanceCharts />
        </TabsContent>

        {/* TAB 6: ALERTAS */}
        <TabsContent value="alerts" className="space-y-4">
          <AlertsList alerts={stats.guards.alerts} />
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

function OrchestrationTimeline({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  const sixHoursInSeconds = 6 * 60 * 60
  const progress = ((sixHoursInSeconds - totalSeconds) / sixHoursInSeconds) * 100

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
            <span className="text-2xl font-mono font-bold text-purple-600">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Última ejecución: hace {6 - hours}h {60 - minutes}min
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SystemHealthMonitor({ health }: { health: { agents: number; database: number; apis: number; guards: number } }) {
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
          <HealthBar label="Agentes" value={health.agents} />
          <HealthBar label="Base de Datos" value={health.database} />
          <HealthBar label="APIs Externas" value={health.apis} />
          <HealthBar label="Guardias" value={Math.round(health.guards)} />
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

function RecentDecisions({ decisions }: { decisions: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decisiones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay decisiones recientes</p>
          ) : (
            decisions.map((decision) => (
              <div key={decision.id} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-2 ${decision.success ? 'bg-green-600' : 'bg-yellow-600'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{decision.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {decision.agent} - {new Date(decision.time).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ActiveJobs({ jobs }: { jobs: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jobs Activos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay jobs activos</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="space-y-1">
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function GuardsStatus({ guards }: { guards: { financial: number; reputation: number; legal: number; alerts: number } }) {
  const guardsList = [
    { name: 'Financial Guard', count: guards.financial, alerts: 0 },
    { name: 'Reputation Guard', count: guards.reputation, alerts: 0 },
    { name: 'Legal Guard', count: guards.legal, alerts: guards.alerts },
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
          {guardsList.map((guard) => (
            <div key={guard.name} className="flex items-center justify-between">
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

function AgentsGrid({ agents }: { agents: any[] }) {
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

function CampaignsTable({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campañas Activas ({count})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          {count === 0 ? 'No hay campañas activas' : `${count} campañas en ejecución`}
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

function AlertsList({ alerts }: { alerts: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          {alerts === 0 ? '✅ No hay alertas activas' : `⚠️ ${alerts} alertas requieren atención`}
        </div>
      </CardContent>
    </Card>
  )
}
