import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SKILL_LEVELS, CHALLENGE_STATUS, GAME_ICONS, GAME_COLORS } from "@/lib/constants";

interface Challenge {
  id: string;
  title: string;
  preset: string;
  startAt: string;
  maxParticipants: number;
  skillLevel: keyof typeof SKILL_LEVELS;
  status: keyof typeof CHALLENGE_STATUS;
  stakeAmount: string;
  stakeType: string;
  venue?: {
    name: string;
  };
  host?: {
    name: string;
  };
  participantCount?: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onClick: () => void;
}

export const ChallengeCard = React.memo(({ challenge, onClick }: ChallengeCardProps) => {
  const gameIcon = GAME_ICONS[challenge.preset] || GAME_ICONS.default;
  const gameColor = GAME_COLORS[challenge.preset] || GAME_COLORS.default;
  const skillLevel = SKILL_LEVELS[challenge.skillLevel];
  const status = CHALLENGE_STATUS[challenge.status];

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const challengeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let dateStr;
    if (challengeDate.getTime() === today.getTime()) {
      dateStr = "Today";
    } else if (challengeDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      dateStr = "Tomorrow";
    } else {
      dateStr = date.toLocaleDateString();
    }
    
    return `${dateStr} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };


  return (
    <Card 
      className="p-5 cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 group" 
      onClick={onClick}
      data-testid={`card-challenge-${challenge.id}`}
    >
      <div className="flex items-start space-x-4">
        {/* Enhanced Game Icon */}
        <div className={`w-14 h-14 bg-gradient-to-br ${gameColor} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
          <i className={`${gameIcon} text-xl`}></i>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header with improved spacing */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-lg leading-tight truncate mb-1" data-testid="text-challenge-title">
                {challenge.title}
              </h3>
              <p className="text-muted-foreground text-sm font-medium truncate flex items-center" data-testid="text-venue-name">
                <i className="fas fa-map-marker-alt mr-2 text-primary/60"></i>
                {challenge.venue?.name}
              </p>
            </div>
            <Badge className={`${status.color} ml-3 flex-shrink-0 font-semibold text-xs px-3 py-1`} data-testid="badge-challenge-status">
              {status.label}
            </Badge>
          </div>

          {/* Date and time with better prominence */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center text-foreground font-medium" data-testid="text-challenge-datetime">
              <i className="fas fa-calendar-alt mr-2 text-primary"></i>
              <span className="text-sm">{formatDateTime(challenge.startAt)}</span>
            </div>
          </div>

          {/* Bottom section with improved layout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Participants */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-primary text-xs"></i>
                </div>
                <span className="font-medium" data-testid="text-participant-count">
                  {challenge.participantCount || 0}/{challenge.maxParticipants}
                </span>
              </div>
              
              {/* Skill Level */}
              <Badge className={`${skillLevel.color} text-xs font-semibold px-3 py-1`} data-testid="badge-skill-level">
                {skillLevel.label}
              </Badge>
            </div>

            {/* Enhanced pricing section */}
            <div className="text-right">
              <div className="text-lg font-bold text-green-600 flex items-center" data-testid="text-free-play">
                <i className="fas fa-gift mr-1 text-sm"></i>
                Free
              </div>
              <div className="text-xs text-muted-foreground font-medium" data-testid="text-free-description">
                Just for fun
              </div>
            </div>
          </div>

          {/* Join button hint on hover */}
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-center">
              <div className="inline-flex items-center text-primary font-semibold text-sm">
                <i className="fas fa-arrow-right mr-2"></i>
                Click to view details
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

ChallengeCard.displayName = 'ChallengeCard';
