export interface Country {
  name: string;
  iso2code: string;
}

export interface Station {
  id: string;
  title: string;
  subtitle: string;
  address: {
    city: string;
    country: {
      name: string;
      iso2code: string;
    }
  }
}

export interface BookingFormData {
  pickupCountry: Country | null;
  returnCountry: Country | null;
  pickupStation: Station | null;
  returnStation: Station | null;
  pickupDate: Date | null;
  returnDate: Date | null;
} 