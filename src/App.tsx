import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import { ShopProvider } from './hooks/useShop';
import { AdminProvider } from './hooks/useAdmin';
import { AgentProvider } from './hooks/useAgent';
import { SocialProvider } from './hooks/useSocial';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import ShopMenu from './pages/Shop/ShopMenu';
import ShopCheckout from './pages/Shop/ShopCheckout';
import ShopOrders from './pages/Shop/ShopOrders';
import OrderTracking from './pages/Shop/OrderTracking';
import DeliveryPage from './pages/Shop/DeliveryPage';
import POSCheckout from './pages/Shop/POSCheckout';
import ShopFeedback from './pages/Shop/ShopFeedback';
import CustomerProfile from './pages/Shop/CustomerProfile';
import KitchenView from './pages/Shop/KitchenView';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RevenueReport from './pages/Admin/RevenueReport';
import { CustomerProvider } from './hooks/useCustomer';
import RitualLab from './pages/RitualLab';


const queryClient = new QueryClient();

export default function App() {
  return (
    <ErrorBoundary>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ShopProvider>
            <AdminProvider>
              <AgentProvider>
                <SocialProvider>
                <CustomerProvider>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/shop" replace />} />
                    <Route path="shop" element={<ShopMenu />} />
                    <Route path="shop/delivery" element={<DeliveryPage />} />
                    <Route path="shop/checkout" element={<POSCheckout />} />
                    <Route path="shop/wallet-checkout" element={<ShopCheckout />} />
                    <Route path="shop/orders" element={<ShopOrders />} />
                    <Route path="shop/track" element={<OrderTracking />} />
                    <Route path="shop/feedback" element={<ShopFeedback />} />
                    <Route path="shop/profile" element={<CustomerProfile />} />
                    <Route path="shop/kitchen" element={<KitchenView />} />
                    <Route path="ritual" element={<RitualLab />} />
                  </Route>
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/revenue" element={<RevenueReport />} />

                </Routes>
                </CustomerProvider>
                </SocialProvider>
              </AgentProvider>
            </AdminProvider>
          </ShopProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
    </ErrorBoundary>
  );
}
