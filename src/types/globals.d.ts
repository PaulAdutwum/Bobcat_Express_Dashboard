declare module '@/lib/constants' {
  export const locations: string[];
}

declare module '@/lib/types' {
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
  
  export type ShuttleLocation = {
    id: string;
    current_location: string;
    lat: number;
    lng: number;
    next_stop: string;
    eta: string;
    status: 'moving' | 'stopped' | 'maintenance';
    speed: number;
    heading: string;
    created_at: string;
    route?: any;
  };
}

declare module '@/lib/firebase' {
  import { Auth, User, GoogleAuthProvider } from 'firebase/auth';
  import { Firestore } from 'firebase/firestore';
  import { FirebaseStorage } from 'firebase/storage';
  
  export const auth: Auth | null;
  export const googleProvider: GoogleAuthProvider;
  export const db: Firestore | null;
  export const storage: FirebaseStorage | null;
}

declare module '@/lib/supabase' {
  import { Ride, ShuttleLocation } from '@/lib/types';
  
  export function fetchRides(status?: 'pending' | 'active' | 'completed'): Promise<Ride[]>;
  export function fetchActiveRides(): Promise<Ride[]>;
  export function fetchPendingRides(): Promise<Ride[]>;
  export function fetchCompletedRides(): Promise<Ride[]>;
  export function createRide(rideData: Omit<Partial<Ride>, 'special_instructions'> & { special_instructions?: string | null }): Promise<Ride[]>;
  export function updateRideStatus(id: string | number, status: 'pending' | 'active' | 'completed' | 'cancelled' | 'archived'): Promise<Ride[]>;
  export function deleteRide(id: string | number): Promise<Ride[]>;
  export function archiveRide(id: string | number): Promise<Ride[]>;
  export function archiveCompletedRides(): Promise<Ride[]>;
  export function fetchShuttleLocation(): Promise<ShuttleLocation | null>;
  export function subscribeToRides(callback: (payload: any) => void): { unsubscribe: () => void };
  export function subscribeToShuttleLocations(callback: (payload: any) => void): { unsubscribe: () => void };
  export function fetchRidesByStatus(status: 'pending' | 'active' | 'completed' | 'cancelled' | 'archived'): Promise<Ride[]>;
  export function fetchDailyRides(): Promise<Ride[]>;
} 