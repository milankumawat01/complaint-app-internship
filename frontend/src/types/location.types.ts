export type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  sub_location_count: number;
};

export type SubLocation = {
  id: number;
  location_id: number;
  name: string;
  floor: string;
  block: string;
  area_type: string;
};

export type TimeSlot = {
  id: number;
  label: string;
  start_time: string;
  end_time: string;
};