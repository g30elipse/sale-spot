import { LocationProvider, Route, Router } from 'preact-iso'
import { Nav } from './components/Nav'
import { Toast } from './components/Toast'
import { CheckoutScreen } from './screens/CheckoutScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { MenuScreen } from './screens/MenuScreen'
import { OrderScreen } from './screens/OrderScreen'
import { ReceiptScreen } from './screens/ReceiptScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SignInScreen } from './screens/SignInScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { PosProvider, usePos } from './store'

function Shell() {
  const { loaded, signedIn } = usePos()
  if (!signedIn) return <SignInScreen />
  if (!loaded) return null
  return (
    <div class="app">
      <Nav />
      <main class="main">
        <Router>
          <Route path="/" component={OrderScreen} />
          <Route path="/checkout" component={CheckoutScreen} />
          <Route path="/receipt" component={ReceiptScreen} />
          <Route path="/history" component={HistoryScreen} />
          <Route path="/summary" component={SummaryScreen} />
          <Route path="/menu" component={MenuScreen} />
          <Route path="/settings" component={SettingsScreen} />
          <Route default component={OrderScreen} />
        </Router>
      </main>
      <Toast />
    </div>
  )
}

export function App() {
  return (
    <LocationProvider>
      <PosProvider>
        <Shell />
      </PosProvider>
    </LocationProvider>
  )
}
