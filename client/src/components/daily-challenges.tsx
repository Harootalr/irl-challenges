import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Trophy, Zap, Target, Gamepad2 } from "lucide-react";

interface DailyChallengesProps {
  onNavigate: (page: string, data?: any) => void;
}

export function DailyChallenges({ onNavigate }: DailyChallengesProps) {
  const dailyTasks = [
    {
      id: 1,
      title: "First Win",
      description: "Win your first challenge today",
      progress: 0,
      target: 1,
      reward: "50 XP",
      difficulty: "Easy",
      icon: <Trophy className="w-4 h-4" />,
      color: "from-yellow-500 to-orange-500"
    },
    {
      id: 2,
      title: "Social Player",
      description: "Play 2 challenges with different opponents",
      progress: 1,
      target: 2,
      reward: "75 XP",
      difficulty: "Medium",
      icon: <Target className="w-4 h-4" />,
      color: "from-blue-500 to-purple-500"
    },
    {
      id: 3,
      title: "Speed Runner",
      description: "Complete a challenge in under 30 minutes",
      progress: 0,
      target: 1,
      reward: "100 XP",
      difficulty: "Hard",
      icon: <Zap className="w-4 h-4" />,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const timeRemaining = "18:42:15";

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "Medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "Hard": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className="p-4" data-testid="card-daily-challenges">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white animate-slow-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" data-testid="text-daily-challenges-title">
              Daily Challenges
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-time-remaining">
              Resets in {timeRemaining}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onNavigate('daily-challenges')}
          data-testid="button-view-all-dailies"
        >
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {dailyTasks.slice(0, 2).map((task) => (
          <div 
            key={task.id} 
            className="p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-muted"
            data-testid={`card-daily-task-${task.id}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 bg-gradient-to-br ${task.color} rounded-md flex items-center justify-center text-white`}>
                  {task.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs" data-testid="text-task-title">
                    {task.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate" data-testid="text-task-description">
                    {task.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getDifficultyColor(task.difficulty)}`}
                  data-testid="badge-task-difficulty"
                >
                  {task.difficulty}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span data-testid="text-task-progress">Progress</span>
                  <span data-testid="text-task-progress-ratio">{task.progress}/{task.target}</span>
                </div>
                <Progress 
                  value={(task.progress / task.target) * 100} 
                  className="h-1.5" 
                  data-testid="progress-task"
                />
              </div>
              <div className="text-xs font-medium text-primary" data-testid="text-task-reward">
                {task.reward}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}