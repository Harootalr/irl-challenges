import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle, Trophy, UserPlus, Crown, Zap, Gamepad2 } from "lucide-react";

interface SocialFeaturesProps {
  onNavigate: (page: string, data?: any) => void;
}

export function SocialFeatures({ onNavigate }: SocialFeaturesProps) {
  const recentFriends = [
    {
      id: 1,
      name: "Alex Chen",
      avatar: "/api/placeholder/32/32",
      status: "online",
      lastGame: "Pool",
      winRate: 78,
      isChampion: true
    },
    {
      id: 2,
      name: "Maria Silva", 
      avatar: "/api/placeholder/32/32",
      status: "in-game",
      lastGame: "Chess",
      winRate: 85,
      isChampion: false
    },
    {
      id: 3,
      name: "David Kim",
      avatar: "/api/placeholder/32/32", 
      status: "offline",
      lastGame: "Darts",
      winRate: 72,
      isChampion: false
    }
  ];

  const socialActivities = [
    {
      id: 1,
      type: "friend_challenge",
      user: "Alex Chen",
      action: "challenged you to Pool",
      time: "2 min ago",
      icon: <Trophy className="w-3 h-3" />
    },
    {
      id: 2,
      type: "friend_win",
      user: "Maria Silva",
      action: "won a Chess match",
      time: "5 min ago", 
      icon: <Crown className="w-3 h-3" />
    },
    {
      id: 3,
      type: "new_friend",
      user: "David Kim",
      action: "is now your friend",
      time: "1 hour ago",
      icon: <UserPlus className="w-3 h-3" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "in-game": return "bg-yellow-500";
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "in-game": return "In Game";
      case "offline": return "Offline";
      default: return "Unknown";
    }
  };

  return (
    <Card className="p-4" data-testid="card-social-features">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white animate-slow-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" data-testid="text-social-features-title">
              Social Hub
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-social-features-subtitle">
              Connect with friends and rivals
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onNavigate('social')}
          data-testid="button-view-social"
        >
          View All
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => onNavigate('invite-friends')}
          data-testid="button-invite-friends"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          Invite
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => onNavigate('messages')}
          data-testid="button-messages"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Chat
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => onNavigate('leaderboards')}
          data-testid="button-leaderboards"
        >
          <Trophy className="w-3 h-3 mr-1" />
          Ranks
        </Button>
      </div>

      {/* Online Friends */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Friends Online</h4>
        <div className="space-y-2">
          {recentFriends.slice(0, 2).map((friend) => (
            <div 
              key={friend.id} 
              className="flex items-center space-x-3 p-2 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onNavigate('friend-profile', friend)}
              data-testid={`card-friend-${friend.id}`}
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={friend.avatar} />
                  <AvatarFallback className="text-xs">
                    {friend.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(friend.status)} rounded-full border-2 border-background`}
                  data-testid="indicator-friend-status"
                ></div>
                {friend.isChampion && (
                  <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-xs truncate" data-testid="text-friend-name">
                    {friend.name}
                  </h5>
                  {friend.isChampion && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      Champion
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span data-testid="text-friend-status">{getStatusText(friend.status)}</span>
                  <span>•</span>
                  <span data-testid="text-friend-last-game">{friend.lastGame}</span>
                  <span>•</span>
                  <span data-testid="text-friend-win-rate">{friend.winRate}% WR</span>
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('challenge-friend', friend);
                }}
                data-testid="button-challenge-friend"
              >
                <Zap className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg">
        <h4 className="text-xs font-medium mb-2 flex items-center space-x-2">
          <MessageCircle className="w-3 h-3" />
          <span data-testid="text-recent-activity-title">Recent Activity</span>
        </h4>
        <div className="space-y-2">
          {socialActivities.slice(0, 2).map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center space-x-2 text-xs"
              data-testid={`activity-item-${activity.id}`}
            >
              <div className="text-purple-600">
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium" data-testid="text-activity-user">{activity.user}</span>
                <span className="text-muted-foreground ml-1" data-testid="text-activity-action">{activity.action}</span>
              </div>
              <span className="text-muted-foreground text-xs" data-testid="text-activity-time">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}