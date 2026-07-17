// src/components/layout/Footer.jsx

import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg text-primary-600 mb-3">Grocery</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fresh groceries delivered to your door in minutes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-primary-600">About Us</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Help</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/orders" className="hover:text-primary-600">Track Order</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-primary-600">Terms of Service</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Grocery. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;