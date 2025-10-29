import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calendar,
  Weight,
  MapPin,
  Heart,
  HeartOff,
  Eye 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Pet } from '@/types/pet';
import { calculatePetAge, formatWeight } from '@/lib/validations/pet';
import { useState } from 'react';
import { useWeightEntries } from '@/queries/weights';

interface PetCardProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onView?: (pet: Pet) => void;
}

export default function PetCard({ pet, onEdit, onDelete, onView }: PetCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const age = calculatePetAge(pet.birthDate);

  // Query latest weight from weight_entries
  const { data: weightData } = useWeightEntries({ 
    petId: pet.id, 
    weightUnit: 'kg' // Default, actual unit comes from entries
  });  

  const latestWeight = weightData?.latestWeight;

  // Placeholder image when no image is available or error loading
  const placeholderImage = (
    <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
      <div className="text-center">
        <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No photo</p>
      </div>
    </div>
  );

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{pet.name}</CardTitle>
            {pet.species ? (
                <p className="text-sm text-muted-foreground">{pet.species}</p>
                ) : (
                <p className="text-sm text-muted-foreground capitalize">{pet.animalType}</p>
                )}
          </div>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <>
                    <DropdownMenuItem onClick={() => onView(pet)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onEdit(pet)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(pet)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="w-full">
          {pet.imageUrl && !imageError ? (
            <img
              src={pet.imageUrl}
              alt={`Photo of ${pet.name}`}
              className="w-full h-32 object-cover rounded-md"
              onError={() => setImageError(true)}
            />
          ) : (
            placeholderImage
          )}
        </div>

        {/* Pet Details */}
        <div className="space-y-3">
          {/* Basic Info Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Badge 
                variant={pet.gender === 'male' ? 'default' : pet.gender === 'female' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '?'} {pet.gender}
              </Badge>
              {pet.isNeutered && (
                <Badge variant="outline" className="text-xs">
                  {pet.isNeutered ? <HeartOff className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
                  <span className="ml-1">Spayed/Neutered</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Age and Weight */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {pet.birthDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{age}</span>
              </div>
            )}
            {latestWeight ? (
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span>{latestWeight.weight} {latestWeight.weightUnit}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Weight className="h-4 w-4" />
                <span className="text-sm">No weight tracked</span>
              </div>
            )}
          </div>

          {/* Microchip */}
          {pet.microchipNumber && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Chip: {pet.microchipNumber}</span>
            </div>
          )}

          {/* Notes Preview */}
          {pet.notes && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-2">
                {pet.notes.length > 100 
                  ? `${pet.notes.substring(0, 100)}...` 
                  : pet.notes
                }
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onView(pet)}
            >
              View Details
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(pet)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
