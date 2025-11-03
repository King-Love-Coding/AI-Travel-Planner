import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Users, MapPin, DollarSign, Calendar, Globe, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      title: 'Interactive Maps',
      description: 'Pin locations and discover places together in real-time with live collaboration.',
      color: 'from-blue-500 to-cyan-500',
      iconComponent: MapPin
    },
    {
      title: 'Expense Sharing',
      description: 'Automatically split costs and track who owes what with smart expense management.',
      color: 'from-green-500 to-emerald-500',
      iconComponent: DollarSign
    },
    {
      title: 'Live Collaboration',
      description: 'See changes instantly as your friends plan with you in real-time.',
      color: 'from-purple-500 to-pink-500',
      iconComponent: Users
    },
    {
      title: 'Smart Itinerary',
      description: 'AI-powered itinerary planning that optimizes your travel schedule automatically.',
      color: 'from-orange-500 to-red-500',
      iconComponent: Calendar
    },
    {
      title: 'Global Community',
      description: 'Connect with travelers worldwide and share authentic experiences and tips.',
      color: 'from-indigo-500 to-purple-500',
      iconComponent: Globe
    },
    {
      title: 'Travel Safety',
      description: 'Real-time alerts and safety tips for your destinations with emergency support.',
      color: 'from-teal-500 to-green-500',
      iconComponent: Sparkles
    }
  ];

  const stats = [
    { number: '50K+', label: 'Happy Travelers', color: 'text-blue-600' },
    { number: '10K+', label: 'Trips Planned', color: 'text-green-600' },
    { number: '150+', label: 'Countries', color: 'text-purple-600' },
    { number: '98%', label: 'Satisfaction Rate', color: 'text-orange-600' }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const fadeInUpVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  const scaleInVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8
      }
    }
  };

  const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full blur-3xl opacity-30"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            animate={{
              y: [0, -20, 0],
              x: [0, Math.sin(i) * 10, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 mb-4"
              >
                <Sparkles size={16} className="text-blue-500" />
                Join 50,000+ travelers worldwide
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold space-y-4">
                <motion.span
                  variants={itemVariants}
                  className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent"
                >
                  Plan Trips
                </motion.span>
                <motion.span
                  variants={itemVariants}
                  className="block bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent"
                >
                  Together
                </motion.span>
              </h1>

              <motion.p
                variants={itemVariants}
                className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                Collaborate with friends, share expenses, and create unforgettable travel memories with our all-in-one platform.
              </motion.p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/signup"
                className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-lg font-semibold flex items-center gap-3"
              >
                Start Planning Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/trips"
                className="group border-2 border-blue-500 text-blue-600 px-8 py-4 rounded-full hover:bg-blue-50 transition-all duration-300 hover:scale-105 text-lg font-semibold flex items-center gap-3"
              >
                View Demo Trips
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto pt-12"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeInUpVariants}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              All the tools to plan your perfect trip, in one place. Designed for modern travelers.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const IconComponent = feature.iconComponent;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    y: -5
                  }}
                  transition={{ duration: 0.2 }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 h-full flex flex-col">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed flex-grow">{feature.description}</p>
                    
                    {/* Hover effect line */}
                    <div className={`h-1 bg-gradient-to-r ${feature.color} rounded-full mt-4 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeInUpVariants}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Trip',
                description: 'Set up your trip details, invite friends, and choose your destination',
                icon: '🎯'
              },
              {
                step: '02',
                title: 'Collaborate & Plan',
                description: 'Use our tools to plan activities, split costs, and build your itinerary',
                icon: '👥'
              },
              {
                step: '03',
                title: 'Travel & Enjoy',
                description: 'Access everything on the go and focus on making memories',
                icon: '✈️'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl mx-auto mb-6">
                  {step.icon}
                </div>
                <div className="text-sm text-blue-600 font-semibold mb-2">{step.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={scaleInVariants}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Adventure?
              </h2>
              <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                Join thousands of travelers who are already planning their dream trips with VoyageSync.
              </p>
              <Link
                to="/signup"
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg group"
              >
                <span className="flex items-center gap-3">
                  Create Your Account
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <div className="mt-6 text-blue-100 text-sm">
                No credit card required • Free forever for basic features
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;