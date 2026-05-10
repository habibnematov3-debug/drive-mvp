import ProfileCard from '../components/ProfileCard'
import type { Passenger } from '../types/drivee'

type ProfileScreenProps = {
  passenger: Passenger
  onLogout: () => void
  onSupport: () => void
}

export default function ProfileScreen({
  passenger,
  onLogout,
  onSupport,
}: ProfileScreenProps) {
  return (
    <div className="screen-enter pb-2 pt-0">
      <ProfileCard
        passenger={passenger}
        onLogout={onLogout}
        onSupport={onSupport}
      />
    </div>
  )
}
