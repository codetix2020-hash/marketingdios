"use client"

import { Button } from '@ui/components/button'
import { Brain, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { orpcClient } from '@shared/lib/orpc-client'

interface SeedMemoryButtonProps {
  organizationId: string
}

export function SeedMemoryButton({ organizationId }: SeedMemoryButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSeedMemory = async () => {
    setIsLoading(true)
    try {
      const result = await orpcClient.marketing.brain.seedMemory({
        organizationId,
      })

      toast.success('✅ Memoria poblada exitosamente', {
        description: `${result.memoriesCreated} memorias creadas (${result.summary.business_dna} ADN, ${result.summary.learning} aprendizajes, ${result.summary.prompt_template} templates)`,
      })
    } catch (error) {
      console.error('Error al poblar memoria:', error)
      toast.error('❌ Error al poblar memoria', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSeedMemory}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Poblando memoria...
        </>
      ) : (
        <>
          <Brain className="mr-2 h-4 w-4" />
          Poblar Memoria de CodeTix
        </>
      )}
    </Button>
  )
}

