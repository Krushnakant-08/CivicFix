import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MdOutlineTrackChanges, MdOutlineAddLocationAlt, MdOutlineVisibility, MdOutlinePeopleOutline } from 'react-icons/md';

const features = [
  { title: "Real-time Tracking", desc: "Monitor the exact status of your reported issues from pending to completely resolved.", Icon: MdOutlineTrackChanges },
  { title: "Image & Location Mapping", desc: "Attach visual proof and pinpoint exact coordinates to help departments act faster.", Icon: MdOutlineAddLocationAlt },
  { title: "Transparent Process", desc: "Know exactly which municipal department is handling your community's concerns.", Icon: MdOutlineVisibility },
  { title: "Community Driven", desc: "Join thousands of active citizens working together to make our city better.", Icon: MdOutlinePeopleOutline }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-mesh font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto text-center animate-slide-up">
        <div className="absolute top-10 right-20 w-32 h-32 bg-stone-300/15 rounded-full blur-3xl animate-float"></div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-stone-800 tracking-tight mb-6">
          Report Civic Issues. <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-cyan-800">
            Improve Your City.
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          A transparent, community-driven platform to report, track, and resolve local civic problems. Be the change your neighborhood needs.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/report">
            <Button variant="primary" className="w-full sm:w-auto text-lg">
              Report an Issue
            </Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" className="w-full sm:w-auto text-lg">
              Learn More
            </Button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="glass-card p-8 animate-slide-up hover:-translate-y-2 transition-transform duration-300 group"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="w-12 h-12 bg-stone-200 rounded-xl mb-6 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                <feature.Icon className="w-6 h-6 text-emerald-700 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
