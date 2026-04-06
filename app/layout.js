import './globals.css';
import { DM_Sans, Syne } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
});

export const metadata = {
  title: 'iBilib — Digital Archive of Aringay NHS',
  description: 'Access research studies, learning materials, and writing prompts from Aringay National High School digital archive.',
  keywords: ['iBilib', 'Aringay NHS', 'digital archive', 'research', 'learning materials', 'education'],
  authors: [{ name: 'iBilib Dev Team' }],
  openGraph: {
    title: 'iBilib — Digital Archive',
    description: 'Access your learning resources in one place',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${syne.variable}`}>
        {children}
      </body>
    </html>
  );
}
