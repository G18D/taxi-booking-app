import './globals.css'

export const metadata = {
  title: 'Taxi VI - Taxi Booking Platform',
  description: 'Professional taxi booking platform for St. John, USVI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
