import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Gamepad2, Bell, Search } from "lucide-react";
import { motion } from "framer-motion";

interface AppHeaderProps {
  onNavigate?: (page: string, data?: any) => void;
}

export function AppHeader({ onNavigate }: AppHeaderProps) {
  const { user } = useAuth();

  const handleNotifications = () => {
    // Navigate to notification settings for now
    onNavigate?.('notification-settings');
  };

  const handleSearch = () => {
    // For now, navigate to challenges page where users can filter/search
    onNavigate?.('challenges');
  };

  const handleProfile = () => {
    onNavigate?.('profile');
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full glass border-b border-glass-border"
    >
      <div className="flex h-16 items-center justify-between px-4">
        <motion.div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => onNavigate?.('home')}
          data-testid="logo-home-link"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg animate-spin-slow"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display font-bold text-xl text-gradient group-hover:scale-105 transition-transform">
            IRL
          </h1>
        </motion.div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-9 h-9 rounded-xl glass hover:bg-primary/10"
              onClick={handleNotifications}
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-9 h-9 rounded-xl glass hover:bg-primary/10"
              onClick={handleSearch}
              data-testid="button-search"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </Button>
          </motion.div>
          
          <motion.div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
            style={{ background: 'var(--gradient-secondary)' }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProfile}
            data-testid="button-profile"
          >
            <span className="text-white text-sm font-bold" data-testid="text-user-initials">
              {user?.name?.slice(0, 2)?.toUpperCase() || "??"}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}