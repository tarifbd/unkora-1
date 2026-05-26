import api from '@/lib/api';

export type AuctionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'SOLD';

export interface Auction {
  id: string;
  productId: string;
  title: string;
  description?: string;
  startingPrice: string | number;
  reservePrice?: string | number | null;
  currentPrice: string | number;
  bidIncrement: string | number;
  status: AuctionStatus;
  startsAt: string;
  endsAt: string;
  winnerId?: string | null;
  totalBids: number;
  featuredImage?: string | null;
  isActive: boolean;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string; isPrimary: boolean }>;
  };
  winner?: { id: string; firstName: string; lastName: string; email: string } | null;
  bids?: AuctionBid[];
  _count?: { bids: number };
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  userId: string;
  amount: string | number;
  isWinning: boolean;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string };
}

export const auctionsApi = {
  list: (params?: { status?: AuctionStatus; page?: number; limit?: number }) =>
    api.get('/auctions', { params }).then(r => r.data.data),
  getActive: () => api.get('/auctions/active').then(r => r.data.data as Auction[]),
  getOne: (id: string) => api.get(`/auctions/${id}`).then(r => r.data.data as Auction),
  getBids: (id: string) => api.get(`/auctions/${id}/bids`).then(r => r.data.data as AuctionBid[]),
  create: (data: object) => api.post('/auctions', data).then(r => r.data.data as Auction),
  update: (id: string, data: object) => api.patch(`/auctions/${id}`, data).then(r => r.data.data as Auction),
  endAuction: (id: string) => api.post(`/auctions/${id}/end`).then(r => r.data.data as Auction),
  remove: (id: string) => api.delete(`/auctions/${id}`),
  placeBid: (id: string, amount: number) =>
    api.post(`/auctions/${id}/bid`, { amount }).then(r => r.data.data as AuctionBid),
};
