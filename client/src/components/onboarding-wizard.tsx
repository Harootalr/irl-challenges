import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface OnboardingWizardProps {
  onComplete: (userData: any) => void;
  isLoading: boolean;
}

export function OnboardingWizard({ onComplete, isLoading }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    homeCity: "Göteborg",
    favoriteGames: [] as string[],
    skillLevel: ""
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const gameOptions = [
    { id: "pool", icon: "fas fa-8ball", label: "Pool/Billiards" },
    { id: "chess", icon: "fas fa-chess", label: "Chess" },
    { id: "darts", icon: "fas fa-bullseye", label: "Darts" },
    { id: "nintendo", icon: "fab fa-nintendo-switch", label: "Nintendo" },
    { id: "pingpong", icon: "fas fa-table-tennis", label: "Ping Pong" },
    { id: "foosball", icon: "fas fa-futbol", label: "Foosball" }
  ];

  const skillLevels = [
    { id: "beginner", label: "Beginner", desc: "Just starting out" },
    { id: "intermediate", label: "Intermediate", desc: "Some experience" },
    { id: "advanced", label: "Advanced", desc: "Experienced player" }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGame = (gameId: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteGames: prev.favoriteGames.includes(gameId)
        ? prev.favoriteGames.filter(id => id !== gameId)
        : [...prev.favoriteGames, gameId]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name && formData.email;
      case 2: return formData.phone && formData.password;
      case 3: return formData.favoriteGames.length > 0;
      case 4: return formData.skillLevel;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gaming elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl text-white/5 animate-bounce">
          <i className="fas fa-gamepad"></i>
        </div>
        <div className="absolute top-32 right-20 text-4xl text-white/5 animate-pulse">
          <i className="fas fa-trophy"></i>
        </div>
        <div className="absolute bottom-32 left-20 text-5xl text-white/5 animate-ping">
          <i className="fas fa-chess"></i>
        </div>
        <div className="absolute bottom-20 right-10 text-4xl text-white/5 animate-bounce delay-300">
          <i className="fas fa-table-tennis"></i>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Hero section */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Welcome to IRL Challenges
          </h1>
          <p className="text-lg opacity-90 mb-2">Let's get you started!</p>
          <div className="flex items-center justify-center space-x-2 text-sm opacity-75">
            <span>Step {step} of {totalSteps}</span>
            <div className="w-20 bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="w-full backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-gamepad text-white text-2xl"></i>
            </div>
            <CardTitle className="text-xl font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {step === 1 && "Personal Info"}
              {step === 2 && "Account Setup"}
              {step === 3 && "Favorite Games"}
              {step === 4 && "Skill Level"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="h-12 text-base"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 text-base"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homeCity">Home City</Label>
                  <Input
                    id="homeCity"
                    type="text"
                    value={formData.homeCity}
                    onChange={(e) => handleInputChange("homeCity", e.target.value)}
                    placeholder="Enter your city"
                    className="h-12 text-base"
                    data-testid="input-home-city"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Account Setup */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+46 XX XXX XX XX"
                    className="h-12 text-base"
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Create a secure password"
                    className="h-12 text-base"
                    data-testid="input-password"
                  />
                  <p className="text-xs text-muted-foreground">Use at least 8 characters</p>
                </div>
              </div>
            )}

            {/* Step 3: Favorite Games */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the games you'd like to play (choose one or more)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {gameOptions.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => toggleGame(game.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-center hover:scale-105 ${
                        formData.favoriteGames.includes(game.id)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`button-game-${game.id}`}
                    >
                      <i className={`${game.icon} text-2xl mb-2 block`}></i>
                      <span className="text-sm font-medium">{game.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Skill Level */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    How would you describe your overall gaming skill?
                  </p>
                </div>
                <div className="space-y-3">
                  {skillLevels.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleInputChange("skillLevel", skill.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                        formData.skillLevel === skill.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`button-skill-${skill.id}`}
                    >
                      <div className="font-medium">{skill.label}</div>
                      <div className="text-sm text-muted-foreground">{skill.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="h-12 px-6"
                data-testid="button-back"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="h-12 px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                data-testid="button-next"
              >
                {isLoading ? "Creating Account..." : step === totalSteps ? "Complete Setup" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features highlight */}
        <div className="mt-8 text-center text-white/80 text-xs space-y-2">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-map-marker-alt text-green-400"></i>
              <span>GPS Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-users text-blue-400"></i>
              <span>Real Players</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt text-purple-400"></i>
              <span>Safe Venues</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}