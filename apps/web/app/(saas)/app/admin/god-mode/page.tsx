import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Activity, Brain, DollarSign, Users } from 'lucide-react'

export default function GodModePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          God Mode Control Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Sistema de marketing autónomo operando 24/7
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,450</div>
            <p className="text-xs text-green-600">+23.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-green-600">+18.2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs">+45 hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€9.50</div>
            <p className="text-xs text-green-600">-32.1%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

