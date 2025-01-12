import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';
import { OffersList } from '../components/offers/OffersList';
import { ApiClient } from '../services/ApiClient';
import { Station } from '../types/booking';
import { Layout } from '../components/Layout';

interface OfferResponse {
  offers: Array<{
    id: string;
    title: string;
    vehicleGroupInfo: {
      groupInfo: {
        imageUrl: string;
        examples: string[];
        maxPassengers: number;
        doors: number;
        baggage: {
          bags: number;
          suitcases: number;
        };
      };
    };
    prices: {
      totalPrice: {
        amount: string;
        currency: string;
      };
    };
  }>;
}

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!router.isReady) return;

      const { 
        pickupStationId, 
        returnStationId, 
        pickupDate, 
        returnDate,
        pickupStation,
        returnStation
      } = router.query;

      if (!pickupStationId || !returnStationId || !pickupDate || !returnDate) {
        router.push('/booking');
        return;
      }

      try {
        setLoading(true);
        const apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL || '');
        
        const queryParams = new URLSearchParams({
          pickupStationId: pickupStationId as string,
          returnStationId: returnStationId as string,
          pickupDate: pickupDate as string,
          returnDate: returnDate as string,
          corporateCustomerNumber: '' as string
        }).toString();

        const response = await apiClient.request<OfferResponse>(`/offers?${queryParams}`);

        setOffers(response);
      } catch (error) {
        console.error('Error fetching offers:', error);
        setError('Failed to fetch offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [router.isReady, router.query]);

  const handleBack = () => {
    router.push('/booking');
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !offers) {
    return (
      <Layout>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {error}
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <OffersList 
        offers={offers}
        onBack={handleBack}
        pickupStation={JSON.parse(router.query.pickupStation as string)}
        returnStation={JSON.parse(router.query.returnStation as string)}
        pickupDate={new Date(router.query.pickupDate as string)}
        returnDate={new Date(router.query.returnDate as string)}
      />
    </Layout>
  );
} 