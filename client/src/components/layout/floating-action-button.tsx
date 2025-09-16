import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <div className="floating-action">
      <Button
        size="lg"
        className="px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        onClick={onClick}
        data-testid="button-create-challenge"
      >
        <i className="fas fa-plus text-lg"></i>
        <span className="font-semibold">Custom</span>
      </Button>
    </div>
  );
}
