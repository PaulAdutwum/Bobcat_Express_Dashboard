export type Ride = {
  id: string;
  created_at: string;
  updated_at?: string;
  student_name: string;
  pickup_location: string;
  destination: string;
  pickup_time: string;
  special_instructions: string | null;
  passengers: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'archived';
  completed_at?: string;
  archived_at?: string;
  duration_minutes?: number;
  student_id?: string;
}; 