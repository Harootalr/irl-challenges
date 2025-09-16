import { Button } from "@/components/ui/button";
import { Home, Trophy, MapPin, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "challenges", icon: Trophy, label: "Challenges" },
    { id: "venues", icon: MapPin, label: "Venues" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 nav-glass z-50"
    >
      <div className="max-w-md mx-auto">
        <div className="flex relative">
          {/* Simplified Active indicator background */}
          <div
            className="absolute top-2 bottom-2 rounded-xl shadow-lg transition-all duration-300 ease-out"
            style={{ 
              background: 'var(--gradient-primary)',
              left: `${tabs.findIndex(t => t.id === activeTab) * 25}%`,
              width: '25%'
            }}
          />
          
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.div
                key={tab.id}
                className="flex-1 relative z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  className={`w-full flex flex-col items-center justify-center py-4 h-auto border-none bg-transparent ${
                    isActive ? "text-white" : "text-muted-foreground hover:text-primary"
                  }`}
                  onClick={() => onTabChange(tab.id)}
                  data-testid={`button-nav-${tab.id}`}
                >
                  <div className={`mb-1 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs transition-all duration-200 ${
                    isActive ? 'font-bold scale-105' : 'font-medium'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Simplified dot indicator */}
                  {isActive && (
                    <div className="absolute -top-1 w-1 h-1 bg-white rounded-full" />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
