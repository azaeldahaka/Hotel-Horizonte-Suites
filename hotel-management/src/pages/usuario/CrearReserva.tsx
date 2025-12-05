import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bed, Utensils, Dumbbell, Waves, MapPin, Phone, Mail, Star, ArrowRight, ChevronRight, Sparkles } from 'lucide-react'

// Imágenes para el carrusel (Asegurate de tenerlas en public/images/... o se repetirán)
const HERO_IMAGES = [
  '/images/lobby/hero.jpg',
  '/images/services/pool.jpg',
  '/images/services/restaurant.jpg' 
]

export const Home = () => {
  const [currentImage, setCurrentImage] = useState(0)

  // Efecto para el carrusel automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000) // Cambia cada 5 segundos
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      
      {/* --- HERO SECTION CON CARRUSEL --- */}
      <div className="relative h-screen w-full overflow-hidden">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentImage}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMAGES[currentImage]})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-5xl"
          >
            <h2 className="text-teal-400 font-medium tracking-[0.2em] uppercase mb-4 text-sm md:text-base">
              Bienvenido al Paraíso
            </h2>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 tracking-tight leading-tight">
              HORIZONTE <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-teal-500">SUITES</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-200 mb-10 font-light max-w-2xl mx-auto leading-relaxed">
              Donde la naturaleza se encuentra con el lujo moderno. <br className="hidden md:block"/> Una experiencia inolvidable te espera en Salta.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group relative px-8 py-4 bg-teal-600 text-white font-semibold rounded-full overflow-hidden shadow-2xl transition-all hover:scale-105 hover:shadow-teal-500/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Reservar Ahora <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                </span>
                <div className="absolute inset-0 bg-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"/>
              </Link>
              
              <Link
                to="/login"
                className="px-8 py-4 text-white font-medium hover:text-teal-200 transition-colors flex items-center gap-2"
              >
                Iniciar Sesión <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Indicadores del Carrusel */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentImage ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* --- SECCIÓN DE SERVICIOS (ANIMADA AL SCROLLEAR) --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-teal-600 font-bold uppercase tracking-wider text-sm">Nuestros Servicios</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mt-2 mb-4">
              Experiencias de Clase Mundial
            </h2>
            <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"/>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard delay={0.1} icon={<Bed className="h-8 w-8" />} title="Suites de Lujo" desc="Descanso garantizado en espacios diseñados para tu confort." />
            <ServiceCard delay={0.2} icon={<Utensils className="h-8 w-8" />} title="Gastronomía" desc="Sabores locales fusionados con alta cocina internacional." />
            <ServiceCard delay={0.3} icon={<Waves className="h-8 w-8" />} title="Spa & Relax" desc="Renueva tu energía con nuestros tratamientos exclusivos." />
            <ServiceCard delay={0.4} icon={<Dumbbell className="h-8 w-8" />} title="Fitness" desc="Mantente en forma con equipamiento de última generación." />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DE HABITACIONES (PARALLAX FEEL) --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
                Elegancia en cada rincón
              </h2>
              <p className="text-lg text-slate-600">
                Cada una de nuestras habitaciones ha sido decorada meticulosamente para ofrecer un ambiente de paz y sofisticación.
              </p>
            </div>
            <Link to="/register" className="hidden md:flex items-center gap-2 text-teal-600 font-bold hover:text-teal-800 transition-colors mt-4 md:mt-0">
              Ver todas las opciones <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <RoomCard image="/images/rooms/room-1.jpg" title="Habitación Simple" price="$40,000" delay={0.1} />
            <RoomCard image="/images/rooms/room-2.jpg" title="Habitación Doble" price="$60,000" delay={0.2} featured />
            <RoomCard image="/images/rooms/suite.jpg" title="Suite Panorama" price="$120,000" delay={0.3} />
          </div>
        </div>
      </section>

      {/* --- UBICACIÓN (MAPA) --- */}
      <section className="py-0 grid md:grid-cols-2 bg-slate-900 text-white">
        <div className="p-12 md:p-24 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-teal-400 mb-4">
            <MapPin className="h-5 w-5" />
            <span className="uppercase tracking-wider font-bold text-sm">Ubicación Privilegiada</span>
          </div>
          <h2 className="text-4xl font-serif font-bold mb-8">En el corazón de la belleza</h2>
          <div className="space-y-6 text-slate-300">
            <div className="flex gap-4">
              <div className="bg-white/10 p-3 rounded-lg h-fit"><MapPin className="h-6 w-6 text-teal-400" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Dirección</h4>
                <p>Av. San Martín 1234, Salta, Argentina</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 p-3 rounded-lg h-fit"><Phone className="h-6 w-6 text-teal-400" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Llámanos</h4>
                <p>+54 387 123 4567</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 p-3 rounded-lg h-fit"><Mail className="h-6 w-6 text-teal-400" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Escríbenos</h4>
                <p>reservas@horizontesuites.com</p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[500px] md:h-auto w-full grayscale hover:grayscale-0 transition-all duration-700">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.149539663036!2d-65.4127572244862!3d-24.790282477975206!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x941bc3a3514d8f19%3A0x64727314d239c03!2sPlaza%209%20de%20Julio!5e0!3m2!1ses!2sar!4v1709234567890!5m2!1ses!2sar" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            title="Mapa del Hotel"
          ></iframe>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24 bg-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-12 w-12 text-amber-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
              Tu historia comienza aquí
            </h2>
            <p className="text-xl text-teal-100 mb-10 font-light">
              Únete a nuestro club exclusivo y recibe beneficios únicos desde tu primera reserva.
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-5 bg-white text-teal-900 font-bold rounded-full shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
            >
              Comenzar Experiencia
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

// --- Componentes Auxiliares con Animación ---

const ServiceCard = ({ icon, title, desc, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
  >
    <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </motion.div>
)

const RoomCard = ({ image, title, price, delay, featured }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`group relative rounded-2xl overflow-hidden shadow-xl ${featured ? 'md:-mt-8 md:mb-8 ring-4 ring-teal-500/20' : ''}`}
  >
    <div className="aspect-[3/4] overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
    <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
      <div className="flex gap-1 text-amber-400 mb-2">
        <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
      </div>
      <h3 className="text-2xl font-serif font-bold text-white mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <p className="text-white/90 font-medium">{price} <span className="text-xs opacity-70">/ noche</span></p>
        <span className="bg-white text-teal-900 text-xs font-bold px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Ver Detalles
        </span>
      </div>
    </div>
  </motion.div>
)