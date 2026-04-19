import { format } from 'date-fns'
import { Clock, Users, Package, User } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import type { RideRequest } from '../types/drivee'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

type EnhancedOrderCardProps = {
  order: RideRequest
}

export default function EnhancedOrderCard({ order }: EnhancedOrderCardProps) {
  const { t } = useLanguage()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'default'
      case 'confirmed':
        return 'secondary'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return t('orders.status.submitted') || 'Submitted'
      case 'confirmed':
        return t('orders.status.confirmed') || 'Confirmed'
      case 'completed':
        return t('orders.status.completed') || 'Completed'
      case 'cancelled':
        return t('orders.status.cancelled') || 'Cancelled'
      default:
        return status
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.routeLabel}</CardTitle>
            <p className="text-sm text-brand-muted mt-1">
              {format(new Date(order.dateISO), 'PPP')}
            </p>
          </div>
          <Badge variant={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-brand-muted">
            <Clock className="h-4 w-4" />
            <span>{order.time}</span>
          </div>
          <div className="flex items-center gap-1 text-brand-muted">
            <Users className="h-4 w-4" />
            <span>{order.passengerCount} {t('orders.passengers') || 'passengers'}</span>
          </div>
          {order.fullCar && (
            <Badge variant="secondary" className="text-xs">
              {t('orders.fullCar') || 'Full Car'}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-brand-muted" />
            <span className="text-brand-ink">{order.passengerPhone}</span>
          </div>
          
          {order.hasBag && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-brand-muted" />
              <span className="text-brand-ink">
                {t('orders.hasLuggage') || 'Has luggage'}
              </span>
            </div>
          )}
        </div>

        {order.comment && (
          <div className="rounded-lg bg-brand-soft/50 p-3">
            <p className="text-sm text-brand-ink">
              <span className="font-medium">
                {t('orders.comment') || 'Comment'}:
              </span>{' '}
              {order.comment}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
