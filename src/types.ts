export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
}

export interface Professor {
  id: string;
  name: string;
  department: string;
  vehicles: Vehicle[];
}

export type Shift = 'morning' | 'afternoon' | 'night';

export interface ParkingSpot {
  id: string;
  number: number;
  shift: Shift;
  occupied: boolean;
  professorId?: string;
  vehicleId?: string;
}

export interface AppState {
  professors: Professor[];
  spots: ParkingSpot[];
  activeTab: 'spots' | 'professors';
  occupyModal: { spotId: string } | null;
  registerModal: boolean;
  editProfessor: Professor | null;
}
