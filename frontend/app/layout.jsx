import '../styles/globals.css';

export const metadata = {
  title: 'Taxi Booking VI',
  description: 'Premium licensed taxi booking platform for the US Virgin Islands',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}