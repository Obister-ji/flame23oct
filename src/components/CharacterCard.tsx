import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CharacterCardProps {
  name: string;
  toolType: string;
  rating: number;
  maxRating: number;
  category: 'UTILITY' | 'ABILITY';
  description?: string;
  image?: string;
  className?: string;
  animationDelay?: string;
  onClick?: () => void;
}

const CharacterCard = memo(({
  name,
  toolType,
  rating,
  maxRating,
  category,
  description,
  image,
  className = '',
  animationDelay = '0s',
  onClick
}: CharacterCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const categoryColors = {
    UTILITY: 'bg-accent text-accent-foreground',
    ABILITY: 'bg-primary text-primary-foreground'
  };

  return (
    <Card
      className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/20 hover:border-accent/30 ${className}`}
      style={{
        animationDelay,
        animation: 'float 6s ease-in-out infinite'
      }}
      onClick={onClick}
    >
      {/* Character Image Placeholder */}
      <div className="relative bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 rounded-t-lg overflow-hidden" style={{ paddingBottom: '75%' }}>
        {image ? (
          <>
            <img
              src={image}
              alt={name}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-300 ${
                imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10">
                <div className="w-8 h-8 rounded-full bg-accent/20 animate-pulse"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Simplified AI Character Illustration */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-accent opacity-80"></div>
              </div>
              {/* Reduced floating particles */}
              <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-accent/40"></div>
            </div>
          </div>
        )}
        
        {/* Simplified floating effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="font-display text-lg font-bold text-primary group-hover:text-accent transition-colors duration-200">
          {name}
        </h3>

        {/* Tool Type */}
        <p className="text-sm text-muted-foreground font-medium">
          {toolType}
        </p>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {[...Array(maxRating)].map((_, i) => (
              <Star 
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) 
                    ? 'text-accent fill-accent' 
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
            <span className="text-sm font-semibold text-foreground ml-2">
              {rating}/{maxRating}
            </span>
          </div>

          {/* Category Badge */}
          <Badge
            className={`text-xs font-semibold ${categoryColors[category]} transition-transform duration-200`}
          >
            {category}
          </Badge>
        </div>

        {/* Description (if provided) */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {description}
          </p>
        )}
      </div>

      {/* Simplified hover glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
    </Card>
  );
});

CharacterCard.displayName = 'CharacterCard';

export default CharacterCard;
