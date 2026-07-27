import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import { ShopProvider } from './hooks/useShop';
import { AdminProvider } from './hooks/useAdmin';
import { AgentProvider } from './hooks/useAgent';
import { SocialProvider } from './hooks/useSocial';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomerProvider } from './hooks/useCustomer';
 
const Layout = lazy(() => import('./components/Layout'));
const ShopMenu = lazy(() => import('./pages/Shop/ShopMenu'));
const ShopCheckout = lazy(() => import('./pages/Shop/ShopCheckout'));
const ShopOrders = lazy(() => import('./pages/Shop/ShopOrders'));
const OrderTracking = lazy(() => import('./pages/Shop/OrderTracking'));
const DeliveryPage = lazy(() => import('./pages/Shop/DeliveryPage'));
const POSCheckout = lazy(() => import('./pages/Shop/POSCheckout'));
const ShopFeedback = lazy(() => import('./pages/Shop/ShopFeedback'));
const CustomerProfile = lazy(() => import('./pages/Shop/CustomerProfile'));
const KitchenView = lazy(() => import('./pages/Shop/KitchenView'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const RevenueReport = lazy(() => import('./pages/Admin/RevenueReport'));
const RitualLab = lazy(() => import('./pages/RitualLab'));

const queryClient = new QueryClient();

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Loading The Daily Cup...</p>
      </div>
    </div>
  );
}

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
                      <Suspense fallback={<RouteLoader />}>
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
                      </Suspense>
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

