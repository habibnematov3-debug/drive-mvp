import { z } from 'zod'

export const rideRequestSchema = z.object({
  routeId: z.enum(['kokand-tashkent', 'tashkent-kokand', 'tashkent-samarkand', 'samarkand-tashkent', 'tashkent-namangan', 'namangan-tashkent']),
  dateISO: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  passengerPhone: z.string().min(9, 'Phone number must be at least 9 digits'),
  passengerCount: z.number().min(1, 'At least 1 passenger required').max(8, 'Maximum 8 passengers allowed'),
  fullCar: z.boolean(),
  passengerGender: z.enum(['any', 'male', 'female']),
  hasBag: z.boolean(),
  comment: z.string().optional(),
})

export type RideRequestFormData = z.infer<typeof rideRequestSchema>
