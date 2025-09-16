import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Gift, Star } from "lucide-react";

interface StreakSystemProps {
  onNavigate: (page: string, data?: any) => void;
}

export function StreakSystem({ onNavigate }: StreakSystemProps) {
  const currentStreak = 7;
  const longestStreak = 15;
  const nextMilestone = 10;
  const streakReward = "Bonus XP Multiplier";

  const streakCalendar = [
    { day: 'Mon', completed: true },
    { day: 'Tue', completed: true },
    { day: 'Wed', completed: true },
    { day: 'Thu', completed: true },
    { day: 'Fri', completed: true },
    { day: 'Sat', completed: true },
    { day: 'Sun', completed: true, isToday: true },
  ];

  const milestones = [
    { days: 5, reward: "50 XP Bonus", achieved: true },
    { days: 10, reward: "2x XP Multiplier", achieved: false },
    { days: 15, reward: "Special Badge", achieved: false },
    { days: 30, reward: "Premium Features", achieved: false },
  ];

  return (
    <Card className="p-4" data-testid="card-streak-system">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" data-testid="text-streak-title">
              Win Streak
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-streak-subtitle">
              Keep playing to maintain your streak!
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onNavigate('streaks')}
          data-testid="button-view-streaks"
        >
          View All
        </Button>
      </div>

      {/* Current Streak Display */}
      <div className="text-center mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <span className="text-2xl font-bold text-orange-600" data-testid="text-current-streak">
            {currentStreak}
          </span>
          <span className="text-sm text-muted-foreground">days</span>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="text-longest-streak">
          Longest streak: {longestStreak} days
        </p>
      </div>

      {/* Weekly Calendar */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">This Week</h4>
        <div className="flex justify-between space-x-1">
          {streakCalendar.map((day, index) => (
            <div 
              key={day.day} 
              className="flex-1 text-center"
              data-testid={`streak-day-${day.day.toLowerCase()}`}
            >
              <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
              <div 
                className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs ${
                  day.completed 
                    ? 'bg-green-500 text-white' 
                    : day.isToday 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {day.completed ? <Star className="w-3 h-3" /> : index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Milestone */}
      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium" data-testid="text-next-milestone">
              Next Milestone: {nextMilestone} days
            </span>
          </div>
          <Badge variant="outline" className="text-xs" data-testid="badge-days-to-go">
            {nextMilestone - currentStreak} to go
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="text-milestone-reward">
          Reward: {streakReward}
        </p>
      </div>
    </Card>
  );
}