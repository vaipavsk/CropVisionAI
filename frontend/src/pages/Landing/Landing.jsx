import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import CTA from './CTA';
import Features from './Features';
import Hero from './Hero';
import Workflow from './Workflow';

function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_45%),linear-gradient(135deg,_#020617,_#0f172a)] text-slate-100">
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
      <CTA />
      <Footer />
    </div>
  );
}

export default Landing;
