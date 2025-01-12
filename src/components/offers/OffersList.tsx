import { Box, Grid, Paper, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Station } from '../../types/booking';

const SIXT_ORANGE = '#ff5f00';

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

interface OffersListProps {
  offers: OfferResponse;
  onBack: () => void;
  pickupStation: Station;
  returnStation: Station;
  pickupDate: Date;
  returnDate: Date;
}

export const OffersList = ({ 
  offers, 
  onBack,
  pickupStation,
  returnStation,
  pickupDate,
  returnDate,
}: OffersListProps) => {
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">Available Vehicles</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          {pickupStation.title} → {returnStation.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pickupDate.toLocaleString()} - {returnDate.toLocaleString()}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {offers.offers.map((offer) => (
          <Grid item xs={12} md={6} lg={4} key={offer.id}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 2,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ position: 'relative', pb: '56.25%', mb: 2 }}>
                <img
                  src={offer.vehicleGroupInfo.groupInfo.imageUrl}
                  alt={offer.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              </Box>
              <Typography variant="h6" gutterBottom>
                {offer.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {offer.vehicleGroupInfo.groupInfo.examples.join(' or ')}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="h5" color={SIXT_ORANGE}>
                  {offer.prices.totalPrice.amount} {offer.prices.totalPrice.currency}
                </Typography>
                <Button 
                  variant="contained"
                  fullWidth
                  sx={{ 
                    mt: 2,
                    backgroundColor: SIXT_ORANGE,
                    '&:hover': {
                      backgroundColor: '#cc4c00',
                    },
                  }}
                >
                  Book now
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}; 