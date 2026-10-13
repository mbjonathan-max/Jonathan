import { Cpu, Mail, Phone, MapPin } from 'lucide-react';
import logoImage from '/images/ChatGPT_Image_5_sept._2026,_20_09_58.png';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoImage} alt="TechStore" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <span className="text-lg font-bold text-white block">TechStore</span>
                <span className="text-xs text-slate-400">Congo, Brazzaville</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Votre spécialiste du matériel informatique. Ordinateurs, composants et accessoires de qualité.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Catégories</h3>
            <ul className="space-y-2 text-sm">
              <li>Ordinateurs portables</li>
              <li>Ordinateurs de bureau</li>
              <li>Composants</li>
              <li>Accessoires</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Congo, Brazzaville
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                +242 065987740
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                m.b.jonathan@icloud.com / mb3135868@gmail.com
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li>Livraison sous 48h à Brazzaville</li>
              <li>Garantie 12 mois</li>
              <li>Paiement sécurisé</li>
              <li>Service client 7j/7</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-sm text-slate-500">
          © 2026 TechStore - BENICIEN JONATHAN MDG. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
